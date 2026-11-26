import { PoolWatchdogService } from './pool-watchdog.service';

describe('PoolWatchdogService', () => {
  let service: PoolWatchdogService;

  beforeEach(() => {
    service = new PoolWatchdogService();
  });

  it('should shed low-priority queries when pool utilization is elevated', () => {
    service.recordUsage(45, 50);
    const health = service.getPoolHealth();
    expect(health.status).toBe('critical');
    expect(service.shouldShed('low', health.utilizationRatio)).toBe(true);
    expect(service.shouldShed('high', health.utilizationRatio)).toBe(false);
  });
});
