/**
 * Architecture Service: Token Revocation List (CRL) Broadcaster
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-12]
 */

import crypto from 'node:crypto';

export class TokenCrlBroadcasterService {
  private revokedTokenHashes: Set<string>;

  constructor() {
    this.revokedTokenHashes = new Set();
  }

  public revokeToken(jti: string): void {
    const hash = this.hashJti(jti);
    this.revokedTokenHashes.add(hash);
  }

  public isRevoked(jti: string): boolean {
    const hash = this.hashJti(jti);
    return this.revokedTokenHashes.has(hash);
  }

  public getRevokedCount(): number {
    return this.revokedTokenHashes.size;
  }

  private hashJti(jti: string): string {
    return crypto.createHash('sha256').update(jti).digest('hex').substring(0, 16);
  }
}
