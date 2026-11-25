/**
 * Architecture Service: OAuth2 PKCE & State Replay Prevention Guard
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-03]
 */

import crypto from 'node:crypto';

export class OAuth2PkceGuardService {
  private activeChallenges: Map<string, { codeChallenge: string; expiresAt: number }>;

  constructor() {
    this.activeChallenges = new Map();
  }

  public createSession(state: string, codeChallenge: string, ttlMs: number = 600000): void {
    this.activeChallenges.set(state, {
      codeChallenge,
      expiresAt: Date.now() + ttlMs
    });
  }

  public verifyCodeVerifier(state: string, codeVerifier: string): boolean {
    const session = this.activeChallenges.get(state);
    if (!session || Date.now() > session.expiresAt) {
      return false; // State missing or expired
    }

    // Single-use guarantee: remove immediately to prevent replay
    this.activeChallenges.delete(state);

    const calculatedChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return calculatedChallenge === session.codeChallenge;
  }
}
