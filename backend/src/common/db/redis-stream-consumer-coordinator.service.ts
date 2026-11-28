import { ClaimResult } from '../../types/db';

export class RedisStreamConsumerCoordinatorService {
  private pendingEntries: Map<string, { consumer: string; lastSeenAt: number }> = new Map();
  private readonly minIdleClaimTimeMs = 30000;

  recordPending(messageId: string, consumer: string): void {
    this.pendingEntries.set(messageId, { consumer, lastSeenAt: Date.now() });
  }

  acknowledge(messageId: string): void {
    this.pendingEntries.delete(messageId);
  }

  claimOrphanedMessages(targetConsumer: string, simulatedNow?: number): ClaimResult {
    const now = simulatedNow || Date.now();
    const claimed: string[] = [];

    for (const [id, record] of this.pendingEntries.entries()) {
      if (now - record.lastSeenAt >= this.minIdleClaimTimeMs) {
        claimed.push(id);
        record.consumer = targetConsumer;
        record.lastSeenAt = now;
      }
    }

    return {
      claimedCount: claimed.length,
      claimedMessageIds: claimed,
      targetConsumer
    };
  }
}
