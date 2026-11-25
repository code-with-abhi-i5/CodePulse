/**
 * Architecture Service: Account Takeover (ATO) Credential Stuffing Detector
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-20]
 */

import crypto from 'node:crypto';

export class CredentialStuffingDetectorService {
  private knownBreachedSha1Prefixes: Set<string>;

  constructor() {
    this.knownBreachedSha1Prefixes = new Set();
  }

  public registerBreachedPrefix(prefix5Chars: string): void {
    this.knownBreachedSha1Prefixes.add(prefix5Chars.toUpperCase());
  }

  public checkPasswordCompromised(password: string): { isCompromised: boolean; sha1Prefix: string } {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const sha1Prefix = sha1.substring(0, 5);

    const isCompromised = this.knownBreachedSha1Prefixes.has(sha1Prefix);
    return { isCompromised, sha1Prefix };
  }
}
