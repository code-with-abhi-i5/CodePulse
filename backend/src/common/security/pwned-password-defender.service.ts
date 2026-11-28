import crypto from 'node:crypto';
import { PwnedCheckResult } from '../../types/security';

export class PwnedPasswordDefenderService {
  private readonly compromisedHashes = new Set<string>();

  public registerKnownBreachedHashes(fullSha1Hashes: string[]): void {
    fullSha1Hashes.forEach(h => this.compromisedHashes.add(h.toUpperCase()));
  }

  public checkPassword(plaintextPassword: string): PwnedCheckResult {
    const sha1 = crypto.createHash('sha1').update(plaintextPassword).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const isPwned = this.compromisedHashes.has(sha1);

    return {
      isPwned,
      prefix,
      hashCount: isPwned ? 1 : 0
    };
  }
}
