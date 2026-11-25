/**
 * Architecture Service: Secret Scanning Automated Key Revoker
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-33]
 */

export interface GitHubLeakAlert {
  token: string;
  type: string;
  url: string;
  source: string;
}

export class SecretScanningKeyRevokerService {
  private activeKeys: Map<string, { keyId: string; owner: string; isRevoked: boolean }>;

  constructor() {
    this.activeKeys = new Map();
  }

  public registerKey(token: string, keyId: string, owner: string): void {
    this.activeKeys.set(token, { keyId, owner, isRevoked: false });
  }

  public handleGitHubLeakAlert(alert: GitHubLeakAlert): {
    wasRevoked: boolean;
    keyId?: string;
    owner?: string;
    message: string;
  } {
    const key = this.activeKeys.get(alert.token);
    if (!key) {
      return { wasRevoked: false, message: 'Leaked token does not match any active key' };
    }

    key.isRevoked = true;
    return {
      wasRevoked: true,
      keyId: key.keyId,
      owner: key.owner,
      message: `API Key '${key.keyId}' leaked on GitHub (${alert.url}) and was automatically revoked.`
    };
  }

  public isKeyValid(token: string): boolean {
    const key = this.activeKeys.get(token);
    return key !== undefined && !key.isRevoked;
  }
}
