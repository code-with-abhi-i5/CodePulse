import { PostgresWalListenerService } from './postgres-wal-listener.service';
import { CdcEventRouterService } from './cdc-event-router.service';
import { RedisStreamsService } from '../../common/redis/redis-streams.service';

describe('PostgreSQL WAL Replication Slot CDC Event Router (#1408)', () => {
  let walListener: PostgresWalListenerService;
  let router: CdcEventRouterService;
  let redisStreamsMock: jest.Mocked<Partial<RedisStreamsService>>;

  beforeEach(() => {
    redisStreamsMock = {
      xadd: jest.fn().mockResolvedValue('1700000000000-0'),
    };

    walListener = new PostgresWalListenerService();
    walListener.onModuleInit();

    router = new CdcEventRouterService(
      walListener,
      redisStreamsMock as unknown as RedisStreamsService,
    );
    router.onModuleInit();
  });

  afterEach(() => {
    router.onModuleDestroy();
    walListener.onModuleDestroy();
  });

  describe('PostgresWalListenerService Core Engine', () => {
    it('captures WAL INSERT operations with incrementing LSN positions and transaction XIDs', async () => {
      const captured = await walListener.handleWalChange('User', 'INSERT', {
        id: 'usr-101',
        username: 'alice',
      });

      expect(captured.table).toBe('User');
      expect(captured.operation).toBe('INSERT');
      expect(captured.lsn).toMatch(/^0\/[0-9A-F]+$/);
      expect(captured.xid).toBeGreaterThan(100000);
      expect(captured.afterImage).toEqual({ id: 'usr-101', username: 'alice' });
    });

    it('reports healthy replication slot status and confirmed flush LSNs', async () => {
      await walListener.handleWalChange('Challenge', 'INSERT', { id: 'c1' });
      const status = walListener.getSlotStatus();

      expect(status.active).toBe(true);
      expect(status.slotName).toBe('codepulse_cdc_slot');
      expect(status.plugin).toBe('pgoutput');
      expect(status.totalChangesCaptured).toBe(1);
      expect(status.confirmedFlushLsn).toBeDefined();
    });
  });

  describe('CdcEventRouterService Stream Delivery', () => {
    it('serializes WAL changes to structured domain events and publishes to Redis stream under 10ms', async () => {
      const change = await walListener.handleWalChange(
        'Battle',
        'UPDATE',
        { id: 'b1', winnerId: 'usr-101' },
        { id: 'b1', winnerId: null },
      );

      const event = await router.routeWalChange(change);

      expect(event.aggregateType).toBe('Battle');
      expect(event.operation).toBe('UPDATED');
      expect(event.deliveryLatencyMs).toBeLessThan(10.0); // Sub-10ms delivery SLA!
      expect(event.payload).toEqual({ id: 'b1', winnerId: 'usr-101' });
      expect(event.previousState).toEqual({ id: 'b1', winnerId: null });

      expect(redisStreamsMock.xadd).toHaveBeenCalledWith(
        'stream:cdc:battle',
        expect.objectContaining({
          op: 'UPDATED',
          table: 'Battle',
        }),
      );
    });

    it('aggregates throughput and sub-10ms SLA compliance telemetry', async () => {
      for (let i = 0; i < 5; i++) {
        await walListener.handleWalChange('Activity', 'INSERT', { id: `act-${i}` });
      }

      const telemetry = router.getTelemetry();
      expect(telemetry.totalEventsRouted).toBe(5);
      expect(telemetry.activeTargetStreams).toContain('stream:cdc:activity');
      expect(telemetry.sub10msSlaMetPercentage).toBeGreaterThanOrEqual(95);
      expect(telemetry.averageDeliveryLatencyMs).toBeLessThan(10.0);
    });
  });
});
