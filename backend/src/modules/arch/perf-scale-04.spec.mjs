import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PayloadCompressionNegotiatorService } from './perf-scale-04.service.ts';

describe('PayloadCompressionNegotiatorService (PERF-SCALE-04)', () => {
  it('selects zstd when supported on large payloads', () => {
    const negotiator = new PayloadCompressionNegotiatorService(1024);
    const res = negotiator.negotiate('gzip, deflate, br, zstd', 5000);
    assert.strictEqual(res.algorithm, 'zstd');
    assert.strictEqual(res.shouldCompress, true);
  });

  it('bypasses compression for small payloads under threshold', () => {
    const negotiator = new PayloadCompressionNegotiatorService(1024);
    const res = negotiator.negotiate('zstd, br, gzip', 256);
    assert.strictEqual(res.algorithm, 'identity');
    assert.strictEqual(res.shouldCompress, false);
  });

  it('falls back to br or gzip when zstd is not supported', () => {
    const negotiator = new PayloadCompressionNegotiatorService();
    const resBr = negotiator.negotiate('gzip, br', 2048);
    assert.strictEqual(resBr.algorithm, 'br');

    const resGzip = negotiator.negotiate('gzip', 2048);
    assert.strictEqual(resGzip.algorithm, 'gzip');
  });
});
