/**
 * Architecture Service: Timing-Attack Resistant Cryptographic Comparator
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-05]
 */

import crypto from 'node:crypto';

export class TimingAttackResistantComparatorService {
  public compareStringsConstantTime(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    if (bufA.length !== bufB.length) {
      // Execute dummy timingSafeEqual against same-length buffer to mitigate length leak
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  }

  public compareHexSignatures(sigA: string, sigB: string): boolean {
    try {
      const bufA = Buffer.from(sigA, 'hex');
      const bufB = Buffer.from(sigB, 'hex');

      if (bufA.length !== bufB.length) {
        crypto.timingSafeEqual(bufA, bufA);
        return false;
      }

      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }
}
