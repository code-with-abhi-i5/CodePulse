import { Injectable } from '@nestjs/common';
import { PoolHealth } from '../../types/database';

@Injectable()
export class PoolWatchdogService {
  private activeConnections: number = 0;
  private maxPoolSize: number = 50;

  recordUsage(active: number, max: number): void {
    this.activeConnections = active;
    this.maxPoolSize = max;
  }

  getPoolHealth(): PoolHealth {
    const ratio = this.maxPoolSize > 0 ? this.activeConnections / this.maxPoolSize : 0;
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (ratio >= 0.9) status = 'critical';
    else if (ratio >= 0.75) status = 'degraded';

    return {
      active: this.activeConnections,
      max: this.maxPoolSize,
      utilizationRatio: ratio,
      status,
    };
  }

  shouldShed(priority: 'high' | 'normal' | 'low', utilizationRatio: number): boolean {
    if (utilizationRatio >= 0.9) {
      return priority !== 'high';
    }
    if (utilizationRatio >= 0.8) {
      return priority === 'low';
    }
    return false;
  }
}
