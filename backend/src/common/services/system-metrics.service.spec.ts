import { SystemMetricsService } from './system-metrics.service';

describe('SystemMetricsService', () => {
  let service: SystemMetricsService;

  beforeEach(() => {
    service = new SystemMetricsService();
  });

  afterEach(() => {
    service.stopSampling();
  });

  it('should initialize with default metrics and sample event loop lag', () => {
    expect(service.getEventLoopLagMs()).toBe(0);
    expect(service.getCpuUsagePercent()).toBe(0);

    const snapshot = service.getMetricsSnapshot();
    expect(snapshot.healthStatus).toBe('GREEN');
    expect(snapshot.memoryUsageMb.heapUsed).toBeGreaterThan(0);
  });

  it('should adjust health status correctly based on event loop lag and CPU thresholds', () => {
    // Green (< 100ms)
    service.setSimulatedMetrics(35, 40);
    expect(service.getMetricsSnapshot().healthStatus).toBe('GREEN');

    // Yellow (>= 100ms)
    service.setSimulatedMetrics(120, 60);
    expect(service.getMetricsSnapshot().healthStatus).toBe('YELLOW');

    // Red (>= 250ms or CPU >= 90%)
    service.setSimulatedMetrics(280, 80);
    expect(service.getMetricsSnapshot().healthStatus).toBe('RED');

    service.setSimulatedMetrics(40, 95);
    expect(service.getMetricsSnapshot().healthStatus).toBe('RED');
  });

  it('should sample event loop lag when running timer', async () => {
    service.startSampling();
    // Advance time slightly
    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(typeof service.getEventLoopLagMs()).toBe('number');
  });
});
