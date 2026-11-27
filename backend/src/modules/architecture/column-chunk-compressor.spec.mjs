import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ColumnChunkCompressorService } from './column-chunk-compressor.service.ts';

describe('ColumnChunkCompressorService [ARCH-CORE-032]', () => {
  const compressor = new ColumnChunkCompressorService();

  test('compresses repeated data with RLE and decompresses with 100% fidelity', () => {
    const raw = [10, 10, 10, 10, 10, 25, 25, 25, 99];
    const compressed = compressor.compressRLE(raw);
    assert.equal(compressed.encoding, 'RLE');
    assert.equal(compressed.originalLength, raw.length);
    assert.ok(compressed.compressedSize < raw.length * 4); // 3 runs * 6 bytes = 18 bytes vs 36 bytes raw

    const restored = compressor.decompressRLE(compressed);
    assert.deepEqual(restored, raw);
  });

  test('compresses monotonically increasing sequences with Delta encoding', () => {
    const rawTimestamps = [1000, 1005, 1010, 1015, 1020, 1025];
    const compressed = compressor.compressDelta(rawTimestamps);
    assert.equal(compressed.encoding, 'DELTA');

    const restored = compressor.decompressDelta(compressed);
    assert.deepEqual(restored, rawTimestamps);
  });
});
