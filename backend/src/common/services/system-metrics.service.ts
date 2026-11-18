import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as os from 'os';

export interface SystemMetricsSnapshot {
  eventLoopLagMs: number;
  cpuUsagePercent: number;
  memoryUsageMb: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  healthStatus: 'GREEN' | 'YELLOW' | 'RED';
  timestamp: string;
}

@Injectable()
export class SystemMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SystemMetricsService.name);

  private eventLoopLagMs = 0;
  private cpuUsagePercent = 0;
  private timer: NodeJS.Timeout | null = null;
  private lastCpuTimes: { idle: number; total: number } | null = null;
  private samplingIntervalMs = 500; // Sample lag every 500ms

  onModuleInit(): void {
    this.startSampling();
  }

  onModuleDestroy(): void {
    this.stopSampling();
  }

  startSampling(): void {
    if (this.timer) return;

    this.lastCpuTimes = this.calculateCpuTimes();

    let lastTime = process.hrtime.bigint();

    this.timer = setInterval(() => {
      // 1. Measure Event Loop Delay
      const now = process.hrtime.bigint();
      const deltaNs = Number(now - lastTime);
      lastTime = now;

      // Event loop delay is elapsed time minus scheduled interval
      const lagMs = Math.max(
        0,
        (deltaNs - this.samplingIntervalMs * 1_000_000) / 1_000_000,
      );
      this.eventLoopLagMs = parseFloat(lagMs.toFixed(2));

      // 2. Sample CPU utilization
      this.cpuUsagePercent = this.sampleCpuUsage();
    }, this.samplingIntervalMs);

    // Unref timer so it doesn't block process exit
    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }

    this.logger.log(
      'SystemMetricsService initialized (sampling event loop delay and CPU)',
    );
  }

  stopSampling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * For testing and simulation purposes: allows explicitly setting simulated lag.
   */
  setSimulatedMetrics(lagMs: number, cpuPercent?: number): void {
    this.eventLoopLagMs = lagMs;
    if (cpuPercent !== undefined) {
      this.cpuUsagePercent = cpuPercent;
    }
  }

  /**
   * Returns the current event loop lag in milliseconds (target < 50ms).
   */
  getEventLoopLagMs(): number {
    return this.eventLoopLagMs;
  }

  /**
   * Returns current CPU utilization percentage (0 - 100).
   */
  getCpuUsagePercent(): number {
    return this.cpuUsagePercent;
  }

  /**
   * Captures a full snapshot of current node and process metrics.
   */
  getMetricsSnapshot(): SystemMetricsSnapshot {
    const mem = process.memoryUsage();

    let healthStatus: SystemMetricsSnapshot['healthStatus'] = 'GREEN';
    if (this.eventLoopLagMs >= 250 || this.cpuUsagePercent >= 90) {
      healthStatus = 'RED';
    } else if (this.eventLoopLagMs >= 100 || this.cpuUsagePercent >= 75) {
      healthStatus = 'YELLOW';
    }

    return {
      eventLoopLagMs: this.eventLoopLagMs,
      cpuUsagePercent: this.cpuUsagePercent,
      memoryUsageMb: {
        rss: Math.round(mem.rss / (1024 * 1024)),
        heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
        heapTotal: Math.round(mem.heapTotal / (1024 * 1024)),
      },
      healthStatus,
      timestamp: new Date().toISOString(),
    };
  }

  private calculateCpuTimes(): { idle: number; total: number } {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
      for (const [type, time] of Object.entries(cpu.times)) {
        total += time;
        if (type === 'idle') {
          idle += time;
        }
      }
    }

    return { idle, total };
  }

  private sampleCpuUsage(): number {
    if (!this.lastCpuTimes) {
      this.lastCpuTimes = this.calculateCpuTimes();
      return 0;
    }

    const currentTimes = this.calculateCpuTimes();
    const idleDiff = currentTimes.idle - this.lastCpuTimes.idle;
    const totalDiff = currentTimes.total - this.lastCpuTimes.total;
    this.lastCpuTimes = currentTimes;

    if (totalDiff <= 0) return 0;
    const usage = 100 - (100 * idleDiff) / totalDiff;
    return parseFloat(Math.min(100, Math.max(0, usage)).toFixed(1));
  }
}
