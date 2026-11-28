import { NonceValidationResult } from '../../types/security';

export class AntiReplayNonceValidatorService {
  private readonly nonceStore = new Map<string, number>();

  constructor(private readonly nonceTtlMs: number = 300000) {}

  public validateAndConsume(nonce: string, now: number = Date.now()): NonceValidationResult {
    // Purge expired nonces
    for (const [n, expiry] of this.nonceStore.entries()) {
      if (now >= expiry) {
        this.nonceStore.delete(n);
      }
    }

    if (this.nonceStore.has(nonce)) {
      return {
        accepted: false,
        nonce,
        reason: 'Replay detected: Nonce has already been consumed'
      };
    }

    this.nonceStore.set(nonce, now + this.nonceTtlMs);
    return {
      accepted: true,
      nonce
    };
  }
}
