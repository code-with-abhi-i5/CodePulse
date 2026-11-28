import crypto from 'node:crypto';
import { PowChallenge } from '../../types/security';

export class PowChallengeIssuerService {
  constructor(private readonly ttlMs: number = 120000) {}

  public issueChallenge(difficultyZeros: number = 4, now: number = Date.now()): PowChallenge {
    const challengeId = crypto.randomUUID();
    const seed = crypto.randomBytes(16).toString('hex');
    const difficultyPrefix = '0'.repeat(difficultyZeros);

    return {
      challengeId,
      difficultyPrefix,
      seed,
      expiresAt: now + this.ttlMs
    };
  }

  public verifySolution(challenge: PowChallenge, nonce: string | number, now: number = Date.now()): boolean {
    if (now > challenge.expiresAt) {
      return false;
    }

    const hash = crypto.createHash('sha256').update(`${challenge.seed}:${nonce}`).digest('hex');
    return hash.startsWith(challenge.difficultyPrefix);
  }
}
