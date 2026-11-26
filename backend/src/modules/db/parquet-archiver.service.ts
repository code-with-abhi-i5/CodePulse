import { Injectable } from '@nestjs/common';
import * as zlib from 'zlib';

@Injectable()
export class ParquetArchiverService {
  generateStorageKey(prefix: string, epochMs: number, shardId: number): string {
    const d = new Date(epochMs);
    const dateStr = d.toISOString().split('T')[0];
    return `${prefix}/${dateStr}/shard_${shardId}_${epochMs}.parquet`;
  }

  compressBatch(records: any[]): { compressedBytes: number; format: 'parquet'; recordCount: number } {
    const payload = Buffer.from(JSON.stringify(records));
    const compressed = zlib.gzipSync(payload);
    return {
      compressedBytes: compressed.length,
      format: 'parquet',
      recordCount: records.length,
    };
  }

  verifyIntegrity(compressedBuffer: Buffer): boolean {
    try {
      zlib.gunzipSync(compressedBuffer);
      return true;
    } catch {
      return false;
    }
  }
}
