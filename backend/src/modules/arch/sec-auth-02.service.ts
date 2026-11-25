/**
 * Architecture Service: JWT Cryptographic Key Rotation Engine with JWKS
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-02]
 */

export interface JwkKey {
  kid: string;
  kty: 'RSA' | 'EC' | 'oct';
  use: 'sig';
  secret: string;
  isPrimary: boolean;
  expiresAt: number;
}

export class JwtKeyRotationEngineService {
  private keyStore: Map<string, JwkKey>;

  constructor() {
    this.keyStore = new Map();
  }

  public registerKey(key: JwkKey): void {
    if (key.isPrimary) {
      for (const existing of this.keyStore.values()) {
        existing.isPrimary = false;
      }
    }
    this.keyStore.set(key.kid, key);
  }

  public getSigningKey(): JwkKey {
    for (const key of this.keyStore.values()) {
      if (key.isPrimary && Date.now() < key.expiresAt) {
        return key;
      }
    }
    throw new Error('No valid primary signing key found in JWKS cache');
  }

  public getVerificationKey(kid: string): JwkKey | null {
    const key = this.keyStore.get(kid);
    if (!key || Date.now() > key.expiresAt) return null;
    return key;
  }

  public getPublicJwks(): Array<{ kid: string; kty: string; use: string }> {
    return Array.from(this.keyStore.values())
      .filter((k) => Date.now() < k.expiresAt)
      .map(({ kid, kty, use }) => ({ kid, kty, use }));
  }
}
