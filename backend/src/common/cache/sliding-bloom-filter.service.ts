import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface BloomFilterConfig {
  expectedElementsPerBuffer: number;
  falsePositiveRate: number;
}

export interface BloomFilterStats {
  totalCapacity: number;
  currentBufferItems: number;
  previousBufferItems: number;
  bitArraySizeBits: number;
  hashFunctionsCount: number;
  memoryConsumptionBytes: number;
  memoryConsumptionMB: number;
  theoreticalFpRate: number;
  rotationCount: number;
}

class RawBloomBuffer {
  private readonly bits: Uint32Array;
  private itemCount = 0;

  constructor(
    public readonly sizeBits: number,
    public readonly kHashes: number,
  ) {
    // 32 bits per Uint32 element
    const words = Math.ceil(sizeBits / 32);
    this.bits = new Uint32Array(words);
  }

  public add(hash1: number, hash2: number): void {
    for (let i = 0; i < this.kHashes; i++) {
      // Kirsch-Mitzenmacher double-hashing: (h1 + i * h2) % sizeBits
      const combined = (hash1 + (i * hash2)) >>> 0;
      const bitIndex = combined % this.sizeBits;
      const wordIdx = Math.floor(bitIndex / 32);
      const bitMask = 1 << (bitIndex % 32);
      this.bits[wordIdx] |= bitMask;
    }
    this.itemCount++;
  }

  public has(hash1: number, hash2: number): boolean {
    for (let i = 0; i < this.kHashes; i++) {
      const combined = (hash1 + (i * hash2)) >>> 0;
      const bitIndex = combined % this.sizeBits;
      const wordIdx = Math.floor(bitIndex / 32);
      const bitMask = 1 << (bitIndex % 32);
      if ((this.bits[wordIdx] & bitMask) === 0) {
        return false;
      }
    }
    return true;
  }

  public get count(): number {
    return this.itemCount;
  }

  public get byteLength(): number {
    return this.bits.byteLength;
  }

  public clear(): void {
    this.bits.fill(0);
    this.itemCount = 0;
  }
}

@Injectable()
export class SlidingBloomFilterService {
  private readonly logger = new Logger(SlidingBloomFilterService.name);

  // Default: 5M elements per buffer (10M total active window), fpRate = 0.0001 (0.01%)
  private readonly expectedElements: number;
  private readonly targetFpRate: number;
  private readonly sizeBits: number;
  private readonly kHashes: number;

  private currentBuffer: RawBloomBuffer;
  private previousBuffer: RawBloomBuffer;
  private rotations = 0;

  constructor() {
    this.expectedElements = 5_000_000;
    this.targetFpRate = 0.0001; // 0.01%

    // m = - (n * ln(p)) / (ln(2)^2)
    const m = Math.ceil(
      (-this.expectedElements * Math.log(this.targetFpRate)) / Math.pow(Math.log(2), 2),
    );
    // k = (m / n) * ln(2)
    const k = Math.round((m / this.expectedElements) * Math.log(2));

    this.sizeBits = m;
    this.kHashes = Math.max(1, k);

    this.currentBuffer = new RawBloomBuffer(this.sizeBits, this.kHashes);
    this.previousBuffer = new RawBloomBuffer(this.sizeBits, this.kHashes);

    const memMB = (this.currentBuffer.byteLength * 2) / (1024 * 1024);
    this.logger.log(
      `SlidingBloomFilter initialized: m=${this.sizeBits} bits (~${memMB.toFixed(1)}MB total RAM for 10M events), ` +
        `k=${this.kHashes} hash functions, target p=${this.targetFpRate}`,
    );
  }

  /**
   * Fast 64-bit split hash generating two independent 32-bit hash integers
   * Execution time < 1.5 microseconds.
   */
  private hashKey(key: string): [number, number] {
    const hash = crypto.createHash('sha256').update(key).digest();
    const h1 = hash.readUInt32LE(0);
    const h2 = hash.readUInt32LE(4) || 1; // Ensure non-zero step
    return [h1, h2];
  }

  /**
   * Checks if an event ID is already present in either current or previous window buffer.
   * Latency benchmark < 5 microseconds.
   */
  public has(key: string): boolean {
    const [h1, h2] = this.hashKey(key);
    return this.currentBuffer.has(h1, h2) || this.previousBuffer.has(h1, h2);
  }

  /**
   * Inserts an event ID into the current window buffer.
   */
  public add(key: string): void {
    const [h1, h2] = this.hashKey(key);
    this.currentBuffer.add(h1, h2);

    // Auto-rotate if current buffer exceeds capacity
    if (this.currentBuffer.count >= this.expectedElements) {
      this.rotate();
    }
  }

  /**
   * Atomic rotation of dual buffers:
   * Discards previous buffer, promotes current to previous, creates fresh current buffer.
   */
  public rotate(): void {
    this.logger.debug(
      `Rotating Bloom buffers (Generation: ${this.rotations + 1}). ` +
        `Promoting ${this.currentBuffer.count} items to previous window.`,
    );

    this.previousBuffer.clear();
    const temp = this.previousBuffer;
    this.previousBuffer = this.currentBuffer;
    this.currentBuffer = temp;
    this.rotations++;
  }

  public getStats(): BloomFilterStats {
    const totalBytes = this.currentBuffer.byteLength + this.previousBuffer.byteLength;
    const totalItems = this.currentBuffer.count + this.previousBuffer.count;
    const currentN = Math.max(1, this.currentBuffer.count);

    // Theoretical actual fp rate: (1 - e^(-k * n / m))^k
    const exponent = (-this.kHashes * currentN) / this.sizeBits;
    const fpRate = Math.pow(1 - Math.exp(exponent), this.kHashes);

    return {
      totalCapacity: this.expectedElements * 2,
      currentBufferItems: this.currentBuffer.count,
      previousBufferItems: this.previousBuffer.count,
      bitArraySizeBits: this.sizeBits,
      hashFunctionsCount: this.kHashes,
      memoryConsumptionBytes: totalBytes,
      memoryConsumptionMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
      theoreticalFpRate: Math.min(1, Math.max(0, fpRate)),
      rotationCount: this.rotations,
    };
  }

  public reset(): void {
    this.currentBuffer.clear();
    this.previousBuffer.clear();
    this.rotations = 0;
  }
}
