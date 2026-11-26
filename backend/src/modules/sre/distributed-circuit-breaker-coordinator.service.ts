import { CircuitBreakerState, BreakerEvent, SharedBreakerStatus } from '../../types/sre';

export class DistributedCircuitBreakerCoordinator {
  private replicaFailures: Map<string, Map<string, number>> = new Map();
  private readonly tripThresholdPerReplica: number = 5;
  private activeProbeReplica: string | null = null;

  reportFailure(serviceKey: string, replicaId: string): BreakerEvent {
    if (!this.replicaFailures.has(serviceKey)) {
      this.replicaFailures.set(serviceKey, new Map());
    }
    const serviceMap = this.replicaFailures.get(serviceKey)!;
    const current = (serviceMap.get(replicaId) || 0) + 1;
    serviceMap.set(replicaId, current);

    const status = this.getStatus(serviceKey);
    return {
      serviceKey,
      replicaId,
      state: status.state,
      consecutiveFailures: current,
      timestamp: Date.now()
    };
  }

  reportSuccess(serviceKey: string, replicaId: string): void {
    const serviceMap = this.replicaFailures.get(serviceKey);
    if (serviceMap) {
      serviceMap.delete(replicaId);
      if (this.activeProbeReplica === replicaId) {
        this.activeProbeReplica = null;
      }
    }
  }

  getStatus(serviceKey: string): SharedBreakerStatus {
    const serviceMap = this.replicaFailures.get(serviceKey);
    if (!serviceMap || serviceMap.size === 0) {
      return {
        serviceKey,
        state: 'CLOSED',
        totalFailuresAcrossReplicas: 0,
        activeReplicasTripped: 0,
        allowRequest: true
      };
    }

    let totalFailures = 0;
    let trippedCount = 0;
    for (const count of serviceMap.values()) {
      totalFailures += count;
      if (count >= this.tripThresholdPerReplica) {
        trippedCount++;
      }
    }

    const state: CircuitBreakerState = trippedCount >= 2 ? 'OPEN' : (trippedCount === 1 ? 'HALF_OPEN' : 'CLOSED');
    return {
      serviceKey,
      state,
      totalFailuresAcrossReplicas: totalFailures,
      activeReplicasTripped: trippedCount,
      allowRequest: state !== 'OPEN'
    };
  }

  canExecute(serviceKey: string, replicaId: string): boolean {
    const status = this.getStatus(serviceKey);
    if (status.state === 'CLOSED') return true;
    if (status.state === 'OPEN') return false;

    if (this.activeProbeReplica === null || this.activeProbeReplica === replicaId) {
      this.activeProbeReplica = replicaId;
      return true;
    }
    return false;
  }
}
