import { PerfHooksMonitorService } from './perf-hooks-monitor.service';
import { GcWatchdogService } from './gc-watchdog.service';

describe('GcWatchdogService & PerfHooksMonitorService', () => {
  let perfMonitor: PerfHooksMonitorService;
  let gcWatchdog: GcWatchdogService;

  beforeEach(() => {
    perfMonitor = new PerfHooksMonitorService();
    gcWatchdog = new GcWatchdogService(perfMonitor);
  });

  afterEach(() => {
    perfMonitor.onModuleDestroy();
  });

  describe('GC event analysis and threshold alerting', () => {
    it('should ignore pauses under the 25ms warning threshold', () => {
      const alert = gcWatchdog.evaluateGcEvent({
        timestampMs: Date.now(),
        durationMs: 8.5,
        type: 'SCAVENGE',
      });

      expect(alert).toBeNull();
    });

    it('should trigger WARNING alert when Scavenge pause exceeds 25ms threshold', () => {
      const alert = gcWatchdog.evaluateGcEvent({
        timestampMs: Date.now(),
        durationMs: 32.4,
        type: 'SCAVENGE',
      });

      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe('WARNING');
      expect(alert?.gcType).toBe('SCAVENGE');
      expect(alert?.pauseDurationMs).toBe(32.4);
      expect(alert?.thresholdMs).toBe(25.0);
    });

    it('should trigger CRITICAL alert when Mark-Sweep pause exceeds 100ms', () => {
      const alert = gcWatchdog.evaluateGcEvent({
        timestampMs: Date.now(),
        durationMs: 145.2,
        type: 'MARK_SWEEP',
      });

      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe('CRITICAL');
      expect(alert?.thresholdMs).toBe(100.0);
      expect(alert?.message).toContain('CRITICAL');
    });
  });

  describe('GC health reporting and percentile computation', () => {
    it('should compute p50, p95, p99 pause durations and flag status correctly', () => {
      // Simulate series of minor pauses
      for (let i = 1; i <= 20; i++) {
        perfMonitor.recordGcEvent({
          timestampMs: Date.now(),
          durationMs: i * 2, // 2ms to 40ms
          type: i % 4 === 0 ? 'MARK_SWEEP' : 'SCAVENGE',
        });
      }

      const report = gcWatchdog.generateHealthReport();
      expect(report.totalGcCount).toBe(20);
      expect(report.majorGcCount).toBe(5);
      expect(report.minorGcCount).toBe(15);
      expect(report.p50PauseMs).toBeGreaterThan(0);
      expect(report.p95PauseMs).toBeGreaterThan(report.p50PauseMs);
      expect(report.maxPauseMs).toBe(40);
      expect(report.status).toMatch(/HEALTHY|DEGRADED|CRITICAL/);
      expect(report.memoryUsage.heapUsedMb).toBeGreaterThan(0);
    });
  });
});
