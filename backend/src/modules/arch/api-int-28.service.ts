/**
 * Architecture Service: Webhook Replay Attack Detector
 * Subsystem: Webhook Security & Freshness Validation
 */

export class WebhookReplayAttackDetectorService {
  private readonly maxToleranceMs: number;
  private readonly seenSignatures = new Set<string>();

  constructor(maxToleranceMs = 5 * 60 * 1000) { // 5 minutes default
    this.maxToleranceMs = maxToleranceMs;
  }

  public validateFreshness(timestampMs: number, signature: string, now: number = Date.now()): { valid: boolean; reason?: string } {
    const diff = Math.abs(now - timestampMs);
    if (diff > this.maxToleranceMs) {
      return { valid: false, reason: 'Timestamp outside freshness tolerance window' };
    }

    if (this.seenSignatures.has(signature)) {
      return { valid: false, reason: 'Replay detected: duplicate signature' };
    }

    this.seenSignatures.add(signature);
    return { valid: true };
  }
}
