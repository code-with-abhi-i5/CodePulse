import { RetryJitterService } from './retry-jitter.service';
import { OutboxPublisherService } from './outbox-publisher.service';

describe('OutboxPublisherService (#1412)', () => {
  let jitterService: RetryJitterService;
  let outboxService: OutboxPublisherService;

  beforeEach(() => {
    jitterService = new RetryJitterService({
      failureThreshold: 3,
      cooldownPeriodMs: 50,
      halfOpenMaxTrials: 2,
    });
    outboxService = new OutboxPublisherService(jitterService);
  });

  afterEach(() => {
    outboxService.onModuleDestroy();
    outboxService.clear();
  });

  it('should enqueue events with PENDING status and valid timestamp', () => {
    const event = outboxService.enqueueEvent(
      'Contest',
      'contest-101',
      'CONTEST_CREATED',
      { name: 'Weekly Blitz' }
    );

    expect(event.id).toBeDefined();
    expect(event.status).toBe('PENDING');
    expect(event.retryCount).toBe(0);

    const telemetry = outboxService.getTelemetry();
    expect(telemetry.totalRecordsEnqueued).toBe(1);
    expect(telemetry.activePendingCount).toBe(1);
  });

  it('should lock rows using SKIP LOCKED semantics without locking other transactions', () => {
    outboxService.enqueueEvent('User', 'u-1', 'USER_REGISTERED', { id: 'u-1' });
    outboxService.enqueueEvent('User', 'u-2', 'USER_REGISTERED', { id: 'u-2' });

    const batch = outboxService.fetchBatchForUpdateSkipLocked(1);
    expect(batch.length).toBe(1);
    expect(batch[0].status).toBe('PUBLISHING');
    expect(batch[0].lockedAt).not.toBeNull();

    // Second worker fetching batch immediately gets second record (zero lock blocking)
    const secondBatch = outboxService.fetchBatchForUpdateSkipLocked(1);
    expect(secondBatch.length).toBe(1);
    expect(secondBatch[0].id).not.toBe(batch[0].id);
    expect(secondBatch[0].status).toBe('PUBLISHING');
  });

  it('should publish successfully when broker is healthy', async () => {
    const publishedPayloads: any[] = [];
    outboxService.registerBrokerHandler(async (record) => {
      publishedPayloads.push(record.payload);
    });

    outboxService.enqueueEvent('Battle', 'b-99', 'BATTLE_COMPLETED', { winner: 'user-A' });
    const count = await outboxService.dispatchCycle(10);

    expect(count).toBe(1);
    expect(publishedPayloads.length).toBe(1);

    const telemetry = outboxService.getTelemetry();
    expect(telemetry.totalPublished).toBe(1);
    expect(telemetry.activeCircuitBreakerState).toBe('CLOSED');
  });

  it('should trip circuit breaker to OPEN when consecutive broker failures exceed threshold', async () => {
    outboxService.registerBrokerHandler(async () => {
      throw new Error('Kafka broker connection refused');
    });

    for (let i = 0; i < 3; i++) {
      outboxService.enqueueEvent('Notification', `n-${i}`, 'NOTIFICATION_SENT', { i });
    }

    // Run cycle - 3 consecutive failures
    await outboxService.dispatchCycle(10);

    const telemetry = outboxService.getTelemetry();
    expect(telemetry.activeCircuitBreakerState).toBe('OPEN');

    // Further dispatch calls must be throttled while circuit breaker is OPEN
    outboxService.enqueueEvent('Notification', 'n-next', 'NOTIFICATION_SENT', {});
    const countWhenOpen = await outboxService.dispatchCycle(10);
    expect(countWhenOpen).toBe(0);
  });

  it('should recover via HALF_OPEN canary trial after cooldown period', async () => {
    let failBroker = true;
    outboxService.registerBrokerHandler(async (record) => {
      if (failBroker) {
        throw new Error('Transient 503');
      }
    });

    for (let i = 0; i < 3; i++) {
      outboxService.enqueueEvent('Order', `ord-${i}`, 'ORDER_PLACED', { i });
    }
    await outboxService.dispatchCycle(10);
    expect(jitterService.getState()).toBe('OPEN');

    // Wait for cooldown (50ms)
    await new Promise((r) => setTimeout(r, 60));
    expect(jitterService.getState()).toBe('HALF_OPEN');

    // Now broker recovers
    failBroker = false;
    outboxService.enqueueEvent('Order', 'ord-canary-1', 'ORDER_PLACED', {});
    outboxService.enqueueEvent('Order', 'ord-canary-2', 'ORDER_PLACED', {});

    await outboxService.dispatchCycle(10);
    expect(jitterService.getState()).toBe('CLOSED');
  });

  it('should route event to DEAD_LETTER when exceeding max retry count (5)', async () => {
    outboxService.registerBrokerHandler(async () => {
      throw new Error('Fatal schema violation');
    });

    const record = outboxService.enqueueEvent('Payment', 'p-1', 'PAYMENT_PROCESSED', {});

    for (let attempt = 0; attempt < 5; attempt++) {
      record.status = 'PENDING';
      record.nextRetryAt = 0;
      await outboxService.dispatchCycle(1);
    }

    expect(record.status).toBe('DEAD_LETTER');
    expect(record.retryCount).toBe(5);
    expect(outboxService.getTelemetry().totalDeadLettered).toBe(1);
  });

  it('should calculate decorrelated jitter and full jitter within valid bounds', () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      const fullJitter = jitterService.calculateFullJitter(attempt, 50, 2000);
      expect(fullJitter).toBeGreaterThanOrEqual(0);
      expect(fullJitter).toBeLessThanOrEqual(2000);
    }

    let prevSleep = 100;
    for (let i = 0; i < 5; i++) {
      prevSleep = jitterService.calculateDecorrelatedJitter(prevSleep, 50, 5000);
      expect(prevSleep).toBeGreaterThanOrEqual(50);
      expect(prevSleep).toBeLessThanOrEqual(5000);
    }
  });
});
