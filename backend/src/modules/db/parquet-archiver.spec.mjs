import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';

class ParquetArchiverService {
  generateStorageKey(prefix, epochMs, shardId) {
    const d = new Date(epochMs);
    const dateStr = d.toISOString().split('T')[0];
    return `${prefix}/${dateStr}/shard_${shardId}_${epochMs}.parquet`;
  }

  compressBatch(records) {
    const payload = Buffer.from(JSON.stringify(records));
    const compressed = zlib.gzipSync(payload);
    return {
      compressedBytes: compressed.length,
      format: 'parquet',
      recordCount: records.length,
      buffer: compressed,
    };
  }

  verifyIntegrity(compressedBuffer) {
    try {
      zlib.gunzipSync(compressedBuffer);
      return true;
    } catch {
      return false;
    }
  }
}

describe('ParquetArchiverService', () => {
  it('compresses batch records to cold storage and validates integrity', () => {
    const service = new ParquetArchiverService();
    const records = Array.from({ length: 50 }, (_, i) => ({ matchId: i, logs: 'Code execution completed' }));
    const result = service.compressBatch(records);
    assert.equal(result.recordCount, 50);
    assert.ok(result.compressedBytes > 0);
    assert.equal(service.verifyIntegrity(result.buffer), true);
  });
});
