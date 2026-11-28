import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class ReplicaLoadBalancerService {
  constructor(maxLagToleranceSeconds = 10) {
    this.maxLagToleranceSeconds = maxLagToleranceSeconds;
  }

  selectReplica(replicas) {
    const eligible = replicas.filter(r => r.isEligible && r.lagSeconds <= this.maxLagToleranceSeconds);

    if (eligible.length === 0) {
      return null;
    }

    return eligible.sort((a, b) => a.lagSeconds - b.lagSeconds || a.activeQueries - b.activeQueries)[0];
  }
}

describe('ReplicaLoadBalancerService', () => {
  const balancer = new ReplicaLoadBalancerService(10);

  it('selects the lowest-lag replica with least active connections', () => {
    const replicas = [
      { replicaId: 'rep-laggy', lagSeconds: 8, activeQueries: 1, isEligible: true },
      { replicaId: 'rep-best', lagSeconds: 0.2, activeQueries: 5, isEligible: true },
      { replicaId: 'rep-busy', lagSeconds: 0.2, activeQueries: 20, isEligible: true }
    ];

    const chosen = balancer.selectReplica(replicas);
    assert.ok(chosen);
    assert.equal(chosen.replicaId, 'rep-best');
  });

  it('filters out ineligible replicas and replicas exceeding lag threshold', () => {
    const replicas = [
      { replicaId: 'rep-broken', lagSeconds: 25, activeQueries: 0, isEligible: true },
      { replicaId: 'rep-disabled', lagSeconds: 1, activeQueries: 0, isEligible: false }
    ];

    const chosen = balancer.selectReplica(replicas);
    assert.equal(chosen, null);
  });
});
