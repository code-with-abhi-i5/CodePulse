import { ReplicaPromoteCheckResult } from '../../types/db';

export class ReplicaPromoteHealthCheckerService {
  constructor(
    private readonly maxLagBytesThreshold: number = 1048576, // 1MB
    private readonly maxLagSecondsThreshold: number = 5
  ) {}

  public evaluatePromoteReadiness(
    replicaId: string,
    replicationLagBytes: number,
    replayLagSeconds: number,
    syncState: 'streaming' | 'in_sync' | 'catchup' | 'disconnected'
  ): ReplicaPromoteCheckResult {
    const reasons: string[] = [];

    if (syncState === 'disconnected') {
      reasons.push('Replica is disconnected from primary');
    } else if (syncState === 'catchup') {
      reasons.push('Replica is in catchup state and not synchronized');
    }

    if (replicationLagBytes > this.maxLagBytesThreshold) {
      reasons.push(`Replication lag ${replicationLagBytes} bytes exceeds threshold ${this.maxLagBytesThreshold} bytes`);
    }

    if (replayLagSeconds > this.maxLagSecondsThreshold) {
      reasons.push(`Replay lag ${replayLagSeconds}s exceeds threshold ${this.maxLagSecondsThreshold}s`);
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

  public rankCandidates(
    candidates: Array<{ replicaId: string; replicationLagBytes: number; replayLagSeconds: number; syncState: 'streaming' | 'in_sync' | 'catchup' | 'disconnected' }>
  ): string[] {
    const evaluated = candidates
      .map(c => this.evaluatePromoteReadiness(c.replicaId, c.replicationLagBytes, c.replayLagSeconds, c.syncState))
      .filter(r => r.isEligibleForPromote);

    return evaluated
      .sort((a, b) => a.replicationLagBytes - b.replicationLagBytes || a.replayLagSeconds - b.replayLagSeconds)
      .map(r => r.replicaId);
  }
}
