import { ReplicaLagMeasurement } from '../../types/db';

export class CrossRegionReplicaLagMonitorService {
  private readonly maxLagAllowedMs = 5000;

  measureLag(region: string, primaryTimestamp: number, replicaTimestamp: number): ReplicaLagMeasurement {
    const lagMs = Math.max(0, primaryTimestamp - replicaTimestamp);
    let status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';

    if (lagMs > 10000) {
      status = 'CRITICAL';
    } else if (lagMs > this.maxLagAllowedMs) {
      status = 'DEGRADED';
    }

    return {
      region,
      lagMs,
      status,
      isEligibleForReads: status === 'HEALTHY'
    };
  }
}
