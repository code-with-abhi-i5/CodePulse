import crypto from 'crypto';

export class BloomFilterPreflightFilter {
  private m: number; // Bit array size
  private k: number; // Hash functions count
  private bits: Uint8Array;

  constructor(expectedItems = 1000, fpp = 0.01) {
    // Optimal m = - (n * ln(p)) / (ln(2)^2)
    this.m = Math.ceil(- (expectedItems * Math.log(fpp)) / (Math.LN2 * Math.LN2));
    // Optimal k = (m / n) * ln(2)
    this.k = Math.max(1, Math.round((this.m / expectedItems) * Math.LN2));
    this.bits = new Uint8Array(Math.ceil(this.m / 8));
  }

  private getHashes(key: string): number[] {
    const hash1 = crypto.createHash('sha256').update(key).digest().readUInt32BE(0);
    const hash2 = crypto.createHash('md5').update(key).digest().readUInt32BE(0);
    const results: number[] = [];

    // Kirsch-Mitzenmacher optimization: g_i(x) = h1(x) + i * h2(x)
    for (let i = 0; i < this.k; i++) {
      const combined = (hash1 + i * hash2) % this.m;
      results.push(combined < 0 ? combined + this.m : combined);
    }
    return results;
  }

  public add(key: string): void {
    const hashes = this.getHashes(key);
    for (const h of hashes) {
      const byteIndex = Math.floor(h / 8);
      const bitIndex = h % 8;
      this.bits[byteIndex] |= (1 << bitIndex);
    }
  }

  public mightContain(key: string): boolean {
    const hashes = this.getHashes(key);
    for (const h of hashes) {
      const byteIndex = Math.floor(h / 8);
      const bitIndex = h % 8;
      if ((this.bits[byteIndex] & (1 << bitIndex)) === 0) {
        return false; // Definitely not present
      }
    }
    return true; // Might be present
  }

  public getBitSize(): number {
    return this.m;
  }

  public getHashCount(): number {
    return this.k;
  }
}
