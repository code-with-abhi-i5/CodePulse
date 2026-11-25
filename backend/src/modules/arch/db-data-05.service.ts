/**
 * Architecture Service: Read-Replica Replication Lag Monitor & Traffic Rerouter
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-05]
 */

export interface ReplicaHealth {
  replicaId: string;
  lagMs: number;
  isOnline: boolean;
}

export class DatabaseReadReplicaLagMonitorService {
  private maxLagThresholdMs: number;

  constructor(maxLagThresholdMs: number = 2000) {
    this.maxLagThresholdMs = maxLagThresholdMs;
  }

  public selectHealthyReplica(replicas: ReplicaHealth[]): {
    selectedReplicaId: string | 'PRIMARY_FALLBACK';
    reroutedDueToLag: boolean;
  } {
    const healthyReplicas = replicas
      .filter((r) => r.isOnline && r.lagMs <= this.maxLagThresholdMs)
      .sort((a, b) => a.lagMs - b.lagMs);

    if (healthyReplicas.length > 0) {
      return {
        selectedReplicaId: healthyReplicas[0].replicaId,
        reroutedDueToLag: false
      };
    }

    return {
      selectedReplicaId: 'PRIMARY_FALLBACK',
      reroutedDueToLag: true
    };
  }
}
