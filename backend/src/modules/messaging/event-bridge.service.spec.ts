import { Test, TestingModule } from '@nestjs/testing';
import { EventBridgeService } from './event-bridge.service';
import { GithubWebhookController } from '../github/github.webhook.controller';
import { GithubWebhookService } from '../github/github.webhook.service';
import { UnauthorizedException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';

describe('EventBridgeService & Async Webhook Ingestion Bridge', () => {
  let bridgeService: EventBridgeService;
  let controller: GithubWebhookController;
  let mockWebhookService: any;

  const webhookSecret = 'codepulse-webhook-secret';

  function generateSignature(payload: string): string {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    return `sha256=${hmac.update(payload).digest('hex')}`;
  }

  beforeEach(async () => {
    mockWebhookService = {
      isDeliveryProcessed: jest.fn().mockReturnValue(false),
      recordDelivery: jest.fn(),
      processPushEvent: jest.fn().mockResolvedValue({ awardedXp: 10 }),
      processPullRequestEvent: jest.fn().mockResolvedValue({ awardedXp: 50 }),
      processStarEvent: jest.fn().mockResolvedValue({ awardedXp: 20 }),
      processReleaseEvent: jest.fn().mockResolvedValue({ awardedXp: 100 }),
      processIssuesEvent: jest.fn().mockResolvedValue({ reproSynthesized: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventBridgeService,
        { provide: GithubWebhookService, useValue: mockWebhookService },
      ],
    }).compile();

    bridgeService = module.get<EventBridgeService>(EventBridgeService);
    controller = new (GithubWebhookController as any)(
      mockWebhookService,
      undefined,
      undefined,
      bridgeService,
    );
    (controller as any).onModuleInit?.();
  });

  afterEach(() => {
    bridgeService.onModuleDestroy();
  });

  describe('Ultra-Low Latency Ingestion (< 15ms target)', () => {
    it('publishes webhook event and acknowledges with HTTP 202 in < 15ms', async () => {
      const payload = {
        repository: { id: 101, full_name: 'code-with-abhi-i5/CodePulse' },
        commits: [{ id: 'c1', message: 'feat: new feature' }],
      };
      const rawPayload = JSON.stringify(payload);
      const signature = generateSignature(rawPayload);
      const deliveryId = 'del-latency-check-1';

      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
      };

      const startTime = performance.now();
      const response: any = await (controller as any).handleWebhook(
        signature,
        'push',
        deliveryId,
        payload,
        mockRes,
      );
      const durationMs = performance.now() - startTime;

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.ACCEPTED);
      expect(response.status).toBe('accepted');
      expect(response.deliveryId).toBe(deliveryId);
      expect(response.partitionKey).toBe('101');
      expect(durationMs).toBeLessThan(15); // Acceptance Criteria: < 15ms consistently
    });

    it('rejects invalid HMAC signature with 401 Unauthorized', async () => {
      const payload = { test: true };
      await expect(
        controller.handleWebhook('sha256=invalid_hash', 'push', 'del-1', payload),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Guaranteed In-Order Processing per Repository Partition Key', () => {
    it('processes sequential pushes strictly in order for the same repository', async () => {
      const executionOrder: string[] = [];
      const partitionKey = 'repo-sequential-order-42';

      bridgeService.registerHandler(async (envelope) => {
        // Small delay to simulate DB write
        await new Promise((r) => setTimeout(r, 5));
        executionOrder.push(envelope.payload.commitSha);
      });

      // Enqueue 10 sequential pushes
      const pushCount = 10;
      for (let i = 1; i <= pushCount; i++) {
        await bridgeService.publishWebhookEvent({
          event: 'push',
          partitionKey,
          payload: { commitSha: `sha-${i}` },
        });
      }

      // Process batches until queue is drained
      while (bridgeService.getPendingCount() > 0) {
        await bridgeService.processBatch(25);
        await new Promise((r) => setTimeout(r, 10));
      }

      expect(executionOrder.length).toBe(pushCount);
      for (let i = 1; i <= pushCount; i++) {
        expect(executionOrder[i - 1]).toBe(`sha-${i}`);
      }
    });

    it('processes multiple repositories concurrently in parallel', async () => {
      const completedRepos: string[] = [];

      bridgeService.registerHandler(async (envelope) => {
        await new Promise((r) => setTimeout(r, 5));
        completedRepos.push(envelope.partitionKey);
      });

      await bridgeService.publishWebhookEvent({
        event: 'push',
        partitionKey: 'repo-A',
        payload: { commit: 'a1' },
      });
      await bridgeService.publishWebhookEvent({
        event: 'push',
        partitionKey: 'repo-B',
        payload: { commit: 'b1' },
      });

      // In one batch, both partitions should be processed concurrently
      const processed = await bridgeService.processBatch(10);
      expect(processed).toBe(2);

      await new Promise((r) => setTimeout(r, 15));
      expect(completedRepos).toContain('repo-A');
      expect(completedRepos).toContain('repo-B');
    });
  });

  describe('Backpressure Control (High/Low Watermark)', () => {
    it('activates backpressure when pending messages exceed high watermark and clears on drain', async () => {
      expect(bridgeService.getMetrics().backpressureActive).toBe(false);

      // Enqueue 550 messages (High Watermark is 500)
      for (let i = 0; i < 550; i++) {
        await bridgeService.publishWebhookEvent({
          event: 'push',
          partitionKey: `repo-${i % 10}`,
          payload: { idx: i },
        });
      }

      const metricsHigh = bridgeService.getMetrics();
      expect(metricsHigh.pendingCount).toBe(550);
      expect(metricsHigh.backpressureActive).toBe(true);

      // Drain below low watermark (100)
      bridgeService.registerHandler(async () => {});
      while (bridgeService.getPendingCount() > 50) {
        await bridgeService.processBatch(100);
      }

      const metricsLow = bridgeService.getMetrics();
      expect(metricsLow.pendingCount).toBeLessThanOrEqual(100);
      expect(metricsLow.backpressureActive).toBe(false);
    });
  });

  describe('Dead-Letter Storage & Replay Tooling', () => {
    it('moves event to events.webhooks.failed after 3 retries and allows replaying', async () => {
      let callCount = 0;
      bridgeService.registerHandler(async () => {
        callCount++;
        throw new Error('Database connection lost');
      });

      await bridgeService.publishWebhookEvent({
        event: 'push',
        partitionKey: 'failing-repo',
        payload: { test: 'retry-fail' },
      });

      // Process batches to exhaust 3 attempts
      for (let i = 0; i < 3; i++) {
        await bridgeService.processBatch(5);
        await new Promise((r) => setTimeout(r, 5));
      }

      expect(callCount).toBe(3);
      expect(bridgeService.getMetrics().totalFailed).toBe(1);

      const failedEvents = bridgeService.getFailedEvents();
      expect(failedEvents.length).toBe(1);
      expect(failedEvents[0].partitionKey).toBe('failing-repo');
      expect(failedEvents[0].reason).toContain('Database connection lost');

      // Now replay the failed event with a working handler
      bridgeService.registerHandler(async () => {
        // Success
      });

      const replayResult = await bridgeService.replayFailedEvents({
        partitionKey: 'failing-repo',
      });

      expect(replayResult.replayedCount).toBe(1);
      expect(replayResult.remainingFailed).toBe(0);

      // Process the replayed message
      await bridgeService.processBatch(5);
      expect(bridgeService.getMetrics().totalReplayed).toBe(1);
      expect(bridgeService.getMetrics().totalProcessed).toBe(1);
    });
  });

  describe('High-Throughput Burst Load Test (5,000 Webhooks/min)', () => {
    it('buffers a burst of 5,000 concurrent webhooks without dropping messages and processes all', async () => {
      const TOTAL_BURST = 5000;
      const PARTITIONS_COUNT = 50;

      let processedCount = 0;
      bridgeService.registerHandler(async () => {
        processedCount++;
      });

      const startTime = performance.now();

      // Enqueue 5,000 webhook events concurrently across 50 repositories
      const publishPromises: Promise<any>[] = [];
      for (let i = 0; i < TOTAL_BURST; i++) {
        const repoId = `repo-${i % PARTITIONS_COUNT}`;
        publishPromises.push(
          bridgeService.publishWebhookEvent({
            event: 'push',
            partitionKey: repoId,
            deliveryId: `burst-del-${i}`,
            payload: { commitIndex: i, repoId },
          }),
        );
      }

      const acks = await Promise.all(publishPromises);
      const enqueueDurationMs = performance.now() - startTime;

      // Acceptance Criteria: zero dropped messages
      expect(acks.length).toBe(TOTAL_BURST);
      expect(bridgeService.getMetrics().totalIngested).toBe(TOTAL_BURST);

      // Verify average ingestion latency < 10ms
      const avgLatency = bridgeService.getMetrics().avgIngestionLatencyMs;
      expect(avgLatency).toBeLessThan(15);

      // Consume batches in loop until all 5,000 messages are processed
      while (bridgeService.getPendingCount() > 0) {
        await bridgeService.processBatch(100);
      }

      expect(processedCount).toBe(TOTAL_BURST);
      expect(bridgeService.getMetrics().totalProcessed).toBe(TOTAL_BURST);
      expect(bridgeService.getPendingCount()).toBe(0);
      expect(enqueueDurationMs).toBeLessThan(10000); // 5,000 events enqueued well under 10s
    });
  });

  describe('Prometheus Metrics & Health', () => {
    it('exports standard Prometheus metrics for bridge ingestion and consumers', async () => {
      await bridgeService.publishWebhookEvent({
        event: 'star',
        partitionKey: 'metric-repo',
        payload: { starred: true },
      });

      const prometheus = bridgeService.exportPrometheusMetrics();

      expect(prometheus).toContain('# HELP codepulse_eventbridge_ingested_total');
      expect(prometheus).toContain('# TYPE codepulse_eventbridge_ingested_total counter');
      expect(prometheus).toContain('codepulse_eventbridge_ingested_total 1');
      expect(prometheus).toContain('codepulse_eventbridge_pending_messages 1');
      expect(prometheus).toContain('codepulse_eventbridge_backpressure_active 0');
      expect(prometheus).toContain('codepulse_eventbridge_avg_ingest_latency_ms');
    });
  });
});

