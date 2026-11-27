import crypto from 'crypto';

export interface HyperLogLogConfig {
  precision?: number; // p: 4 to 16, default 10 (m = 2^p = 1024 registers)
  hashSeed?: number;
}

export class HyperLogLogEstimator {
  private readonly p: number;
  private readonly m: number;
  private readonly alphaM: number;
  private registers: Uint8Array;

  constructor(config: HyperLogLogConfig = {}) {
    this.p = Math.min(16, Math.max(4, config.precision ?? 10));
    this.m = 1 << this.p;
    this.registers = new Uint8Array(this.m);

    // Alpha_m precomputation
    if (this.m === 16) this.alphaM = 0.673;
    else if (this.m === 32) this.alphaM = 0.697;
    else if (this.m === 64) this.alphaM = 0.709;
    else this.alphaM = 0.7213 / (1 + 1.079 / this.m);
  }

  private hash64(val: string): bigint {
    const hash = crypto.createHash('sha256').update(val).digest();
    return hash.readBigUInt64BE(0);
  }

  public add(value: string | number): void {
    const str = String(value);
    const hash = this.hash64(str);
    
    // First p bits determine register index
    const registerIndex = Number(hash >> BigInt(64 - this.p));
    
    // Remaining (64 - p) bits determine rank (leading zeros + 1)
    const remainingBits = hash & ((1n << BigInt(64 - this.p)) - 1n);
    let rank = 1;
    let mask = 1n << BigInt(63 - this.p);
    while (rank <= (64 - this.p) && (remainingBits & mask) === 0n) {
      rank++;
      mask >>= 1n;
    }

    if (rank > this.registers[registerIndex]) {
      this.registers[registerIndex] = rank;
    }
  }

  public estimate(): number {
    let sum = 0;
    let zeros = 0;

    for (let i = 0; i < this.m; i++) {
      const val = this.registers[i];
      sum += Math.pow(2, -val);
      if (val === 0) {
        zeros++;
      }
    }

    const rawEstimate = this.alphaM * this.m * this.m / sum;

    // Small range correction (Linear Counting)
    if (rawEstimate <= 2.5 * this.m) {
      if (zeros > 0) {
        return Math.round(this.m * Math.log(this.m / zeros));
      }
      return Math.round(rawEstimate);
    }

    // Large range correction for 64-bit bounds
    const twoTo64 = Math.pow(2, 64);
    if (rawEstimate > (1 / 30) * twoTo64) {
      return Math.round(-twoTo64 * Math.log(1 - rawEstimate / twoTo64));
    }

    return Math.round(rawEstimate);
  }

  public merge(other: HyperLogLogEstimator): void {
    if (this.p !== other.p) {
      throw new Error(`Cannot merge HyperLogLog with different precisions: ${this.p} vs ${other.p}`);
    }
    for (let i = 0; i < this.m; i++) {
      if (other.registers[i] > this.registers[i]) {
        this.registers[i] = other.registers[i];
      }
    }
  }

  public getRegisterCount(): number {
    return this.m;
  }

  public getPrecision(): number {
    return this.p;
  }

  public reset(): void {
    this.registers.fill(0);
  }
}
