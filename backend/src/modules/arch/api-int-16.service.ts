/**
 * Architecture Service: Decompression Bomb Guard
 * Subsystem: API Gateway Ingress Protection
 */

export class DecompressionBombGuardService {
  private readonly maxUncompressedBytes: number;
  private readonly maxExpansionRatio: number;

  constructor(maxUncompressedBytes = 10 * 1024 * 1024, maxExpansionRatio = 100) {
    this.maxUncompressedBytes = maxUncompressedBytes;
    this.maxExpansionRatio = maxExpansionRatio;
  }

  public validateExpansion(compressedBytes: number, uncompressedBytes: number): { allowed: boolean; reason?: string } {
    if (uncompressedBytes > this.maxUncompressedBytes) {
      return { allowed: false, reason: 'Exceeded maximum uncompressed size ceiling' };
    }
    if (compressedBytes > 0 && (uncompressedBytes / compressedBytes) > this.maxExpansionRatio) {
      return { allowed: false, reason: 'Abnormal expansion ratio (zip bomb signature)' };
    }
    return { allowed: true };
  }
}
