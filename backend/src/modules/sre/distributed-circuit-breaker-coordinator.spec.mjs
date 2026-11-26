import test from 'node:test';
import assert from 'node:assert/strict';

class DistributedCircuitBreakerCoordinator {
  constructor() {
    this.replicaFailures = new Map();
    this.tripThresholdPerReplica = 5;
    this.activeProbeReplica = null;
  }

  reportFailure(serviceKey, replicaId) {
    if (!this.replicaFailures.has(serviceKey)) {
      this.replicaFailures.set(serviceKey, new Map());
    }
    const serviceMap = this.replicaFailures.get(serviceKey);
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

  reportSuccess(serviceKey, replicaId) {
    const serviceMap = this.replicaFailures.get(serviceKey);
    if (serviceMap) {
      serviceMap.delete(replicaId);
      if (this.activeProbeReplica === replicaId) {
        this.activeProbeReplica = null;
      }
    }
  }

  getStatus(serviceKey) {
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

    const state = trippedCount >= 2 ? 'OPEN' : (trippedCount === 1 ? 'HALF_OPEN' : 'CLOSED');
    return {
      serviceKey,
      state,
      totalFailuresAcrossReplicas: totalFailures,
      activeReplicasTripped: trippedCount,
      allowRequest: state !== 'OPEN'
    };
  }

  canExecute(serviceKey, replicaId) {
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

test('DistributedCircuitBreakerCoordinator - synchronizes circuit trips across replica instances', () => {
  const coordinator = new DistributedCircuitBreakerCoordinator();
  coordinator.reportFailure('auth-service', 'pod-1');
  assert.strictEqual(coordinator.getStatus('auth-service').state, 'CLOSED');

  for (let i = 0; i < 5; i++) {
    coordinator.reportFailure('auth-service', 'pod-1');
    coordinator.reportFailure('auth-service', 'pod-2');
  }

  const openStatus = coordinator.getStatus('auth-service');
  assert.strictEqual(openStatus.state, 'OPEN');
  assert.strictEqual(coordinator.canExecute('auth-service', 'pod-3'), false);

  coordinator.reportSuccess('auth-service', 'pod-1');
  coordinator.reportSuccess('auth-service', 'pod-2');
  assert.strictEqual(coordinator.getStatus('auth-service').state, 'CLOSED');
});
