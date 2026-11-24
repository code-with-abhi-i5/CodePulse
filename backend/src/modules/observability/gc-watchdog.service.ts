import { Injectable, Logger } from '@nestjs/common';
import { PerfHooksMonitorService, GcEventRecord } from './perf-hooks-monitor.service';

export interface GcAlert {
  alertId: string;
  timestamp: Date;
  severity: 'WARNING' | 'CRITICAL';
  gcType: string;
  pauseDurationMs: number;
  thresholdMs: number;
  heapUsedMb: number;
  heapTotalMb: number;
  message: string;
}

export interface GcHealthReport {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  totalGcCount: number;
  majorGcCount: number;
  minorGcCount: number;
  p50PauseMs: number;
  p95PauseMs: number;
  p99PauseMs: number;
  maxPauseMs: number;
  activeAlerts: GcAlert[];
  memoryUsage: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
}

@Injectable()
export class GcWatchdogService {
  private readonly logger = new Logger(GcWatchdogService.name);

  // Configurable thresholds
  public static readonly WARNING_THRESHOLD_MS = 25.0; // 25ms threshold as per problem statement
  public static readonly CRITICAL_THRESHOLD_MS = 100.0;

  private readonly alerts: GcAlert[] = [];

  constructor(private readonly perfMonitor: PerfHooksMonitorService) {}

  /**
   * Analyzes a newly recorded GC pause event and triggers alerts if pause duration violates thresholds.
   */
  public evaluateGcEvent(event: GcEventRecord): GcAlert | null {
    if (event.durationMs < GcWatchdogService.WARNING_THRESHOLD_MS) {
      return null;
    }

    const mem = process.memoryUsage();
    const heapUsedMb = Number((mem.heapUsed / 1024 / 1024).toFixed(2));
    const heapTotalMb = Number((mem.heapTotal / 1024 / 1024).toFixed(2));

    const severity = event.durationMs >= GcWatchdogService.CRITICAL_THRESHOLD_MS ? 'CRITICAL' : 'WARNING';
    const threshold = severity === 'CRITICAL' ? GcWatchdogService.CRITICAL_THRESHOLD_MS : GcWatchdogService.WARNING_THRESHOLD_MS;

    const alert: GcAlert = {
      alertId: `gc-alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date(),
      severity,
      gcType: event.type,
      pauseDurationMs: Number(event.durationMs.toFixed(2)),
      thresholdMs: threshold,
      heapUsedMb,
      heapTotalMb,
      message: `[${severity}] V8 ${event.type} pause duration (${event.durationMs.toFixed(1)}ms) exceeded ${threshold}ms threshold. Heap: ${heapUsedMb}MB / ${heapTotalMb}MB`,
    };

    this.alerts.push(alert);
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    if (severity === 'CRITICAL') {
      this.logger.error(alert.message);
    } else {
      this.logger.warn(alert.message);
    }

    return alert;
  }

  /**
   * Generates a comprehensive GC latency health assessment report.
   */
  public generateHealthReport(): GcHealthReport {
    const events = this.perfMonitor.getRecentGcEvents(500);
    const mem = process.memoryUsage();

    let majorCount = 0;
    let minorCount = 0;
    const durations = events.map((e) => {
      if (e.type === 'MARK_SWEEP') majorCount++;
      else if (e.type === 'SCAVENGE') minorCount++;
      return e.durationMs;
    });

    durations.sort((a, b) => a - b);

    const p50 = this.getPercentile(durations, 50);
    const p95 = this.getPercentile(durations, 95);
    const p99 = this.getPercentile(durations, 99);
    const maxPause = durations.length > 0 ? durations[durations.length - 1] : 0;

    let status: GcHealthReport['status'] = 'HEALTHY';
    if (p99 >= GcWatchdogService.CRITICAL_THRESHOLD_MS) {
      status = 'CRITICAL';
    } else if (p95 >= GcWatchdogService.WARNING_THRESHOLD_MS) {
      status = 'DEGRADED';
    }

    return {
      status,
      totalGcCount: events.length,
      majorGcCount: majorCount,
      minorGcCount: minorCount,
      p50PauseMs: p50,
      p95PauseMs: p95,
      p99PauseMs: p99,
      maxPauseMs: maxPause,
      activeAlerts: this.alerts.slice(-10),
      memoryUsage: {
        heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
        heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
        rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
      },
    };
  }

  private getPercentile(sorted: number[], pct: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((pct / 100) * sorted.length) - 1;
    return Number(sorted[Math.max(0, Math.min(index, sorted.length - 1))].toFixed(2));
  }
}
