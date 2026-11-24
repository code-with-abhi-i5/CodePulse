import { Injectable, Logger } from '@nestjs/common';

export interface QueueSample {
  timestamp: number;
  depth: number;
  drainRatePerSec: number;
}

export interface VelocityMetrics {
  currentDepth: number;
  velocityItemsPerSec: number; // dQ/dt (rate of change)
  accelerationItemsPerSec2: number; // d2Q/dt2
  projectedDepthIn60Sec: number;
  isSurgeDetected: boolean;
}

@Injectable()
export class QueueVelocityProbeService {
  private readonly logger = new Logger(QueueVelocityProbeService.name);

  // Sliding window of queue telemetry samples
  private readonly samples: QueueSample[] = [];
  private readonly maxWindowSamples = 30;

  // Surge threshold in items/sec (e.g. hackathon kickoff)
  private readonly surgeThresholdPerSec = 50;

  /**
   * Records a queue depth sample with current processing drain rate.
   */
  public recordSample(depth: number, drainRatePerSec = 20, timestamp = Date.now()): VelocityMetrics {
    this.samples.push({
      timestamp,
      depth,
      drainRatePerSec,
    });

    if (this.samples.length > this.maxWindowSamples) {
      this.samples.shift();
    }

    return this.calculateVelocity(timestamp);
  }

  /**
   * Calculates the first derivative (velocity) and second derivative (acceleration) of queue backlog.
   */
  public calculateVelocity(now = Date.now()): VelocityMetrics {
    if (this.samples.length < 2) {
      const current = this.samples[this.samples.length - 1]?.depth ?? 0;
      return {
        currentDepth: current,
        velocityItemsPerSec: 0,
        accelerationItemsPerSec2: 0,
        projectedDepthIn60Sec: current,
        isSurgeDetected: false,
      };
    }

    const latest = this.samples[this.samples.length - 1];
    const previous = this.samples[this.samples.length - 2];

    const deltaTSeconds = Math.max(0.1, (latest.timestamp - previous.timestamp) / 1000);
    const deltaQ = latest.depth - previous.depth;

    // Rate of change: dQ/dt
    const velocity = Math.round((deltaQ / deltaTSeconds) * 100) / 100;

    // Acceleration: rate of change of velocity
    let acceleration = 0;
    if (this.samples.length >= 3) {
      const older = this.samples[this.samples.length - 3];
      const olderDeltaT = Math.max(0.1, (previous.timestamp - older.timestamp) / 1000);
      const prevVelocity = (previous.depth - older.depth) / olderDeltaT;
      acceleration = Math.round(((velocity - prevVelocity) / deltaTSeconds) * 100) / 100;
    }

    // Proactive lookahead: project depth in 60s
    const netVelocity = velocity - latest.drainRatePerSec;
    const projectedIn60Sec = Math.max(0, Math.round(latest.depth + netVelocity * 60));
    const isSurgeDetected = velocity >= this.surgeThresholdPerSec;

    return {
      currentDepth: latest.depth,
      velocityItemsPerSec: velocity,
      accelerationItemsPerSec2: acceleration,
      projectedDepthIn60Sec: projectedIn60Sec,
      isSurgeDetected,
    };
  }

  public clear(): void {
    this.samples.length = 0;
  }
}
