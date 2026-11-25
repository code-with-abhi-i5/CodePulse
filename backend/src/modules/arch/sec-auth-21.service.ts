/**
 * Architecture Service: CSPRNG Health Monitor & Entropy Validator
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-21]
 */

import crypto from 'node:crypto';

export class CsprngEntropyMonitorService {
  public sampleAndVerifyEntropy(bytesCount: number = 32): { isHealthy: boolean; shannonEntropy: number } {
    const bytes = crypto.randomBytes(bytesCount);
    const byteFrequencies = new Map<number, number>();

    for (const b of bytes) {
      byteFrequencies.set(b, (byteFrequencies.get(b) || 0) + 1);
    }

    let entropy = 0;
    for (const count of byteFrequencies.values()) {
      const p = count / bytesCount;
      entropy -= p * Math.log2(p);
    }

    // Normal random distribution for 32 bytes yields high Shannon entropy (> 3.5 bits/byte)
    const isHealthy = entropy >= 3.0;
    return { isHealthy, shannonEntropy: Number(entropy.toFixed(2)) };
  }
}
