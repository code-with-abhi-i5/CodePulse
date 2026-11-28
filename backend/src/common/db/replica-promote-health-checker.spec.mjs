import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class ReplicaPromoteHealthCheckerService {
  constructor(maxLagBytesThreshold = 1048576, maxLagSecondsThreshold = 5) {
    this.maxLagBytesThreshold = maxLagBytesThreshold;
    this.maxLagSecondsThreshold = maxLagSecondsThreshold;
  }

  evaluatePromoteReadiness(replicaId, replicationLagBytes, replayLagSeconds, syncState) {
    const reasons = [];

    if (syncState === 'disconnected') {
      reasons.push('Replica is disconnected from primary');
    } else if (syncState === 'catchup') {
      reasons.push('Replica is in catchup state and not synchronized');
    }

    if (replicationLagBytes > this.maxLagBytesThreshold) {
      reasons.push('Replication lag ' + replicationLagBytes + ' bytes exceeds threshold ' + this.maxLagBytesThreshold + ' bytes');
    }

    if (replayLagSeconds > this.maxLagSecondsThreshold) {
      reasons.push('Replay lag ' + replayLagSeconds + 's exceeds threshold ' + this.maxLagSecondsThreshold + 's');
    }

    const isEligibleForPromote = reasons.length === 0;

    return {
      isEligibleForPromote,
      replicaId,
      replicationLagBytes,
      replayLagSeconds,
      syncState,
      reasons
    };
  }

  rankCandidates(candidates) {
    const evaluated = candidates
      .map(c => this.evaluatePromoteReadiness(c.replicaId, c.replicationLagBytes, c.replayLagSeconds, c.syncState))
      .filter(r => r.isEligibleForPromote);

    return evaluated
      .sort((a, b) => a.replicationLagBytes - b.replicationLagBytes || a.replayLagSeconds - b.replayLagSeconds)
      .map(r => r.replicaId);
  }
}

describe('ReplicaPromoteHealthCheckerService', () => {
  const service = new ReplicaPromoteHealthCheckerService(1000, 2);

  it('identifies healthy replicas eligible for promotion', () => {
    const res = service.evaluatePromoteReadiness('rep-1', 200, 0.5, 'in_sync');
    assert.equal(res.isEligibleForPromote, true);
    assert.equal(res.reasons.length, 0);
  });

  it('rejects disconnected or catchup replicas', () => {
    const resDisc = service.evaluatePromoteReadiness('rep-2', 0, 0, 'disconnected');
    assert.equal(resDisc.isEligibleForPromote, false);
    assert.ok(resDisc.reasons[0].includes('disconnected'));

    const resCatchup = service.evaluatePromoteReadiness('rep-3', 0, 0, 'catchup');
    assert.equal(resCatchup.isEligibleForPromote, false);
    assert.ok(resCatchup.reasons[0].includes('catchup'));
  });

  it('rejects replicas exceeding lag thresholds', () => {
    const resLag = service.evaluatePromoteReadiness('rep-4', 5000, 10, 'streaming');
    assert.equal(resLag.isEligibleForPromote, false);
    assert.equal(resLag.reasons.length, 2);
  });

  it('ranks eligible candidates by lowest byte lag and replay latency', () => {
    const candidates = [
      { replicaId: 'rep-a', replicationLagBytes: 500, replayLagSeconds: 1, syncState: 'streaming' },
      { replicaId: 'rep-b', replicationLagBytes: 100, replayLagSeconds: 0.2, syncState: 'in_sync' },
      { replicaId: 'rep-bad', replicationLagBytes: 99999, replayLagSeconds: 50, syncState: 'streaming' }
    ];
    const ranked = service.rankCandidates(candidates);
    assert.deepEqual(ranked, ['rep-b', 'rep-a']);
  });
});
