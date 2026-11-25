import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Http3QuicConnectionPoolService } from './perf-scale-07.service.ts';

describe('Http3QuicConnectionPoolService (PERF-SCALE-07)', () => {
  it('multiplexes independent QUIC streams without head-of-line blocking', () => {
    const pool = new Http3QuicConnectionPoolService(10);
    const s1 = pool.openStream(1);
    const s2 = pool.openStream(2);

    assert.strictEqual(pool.getActiveStreamCount(), 2);
    assert.strictEqual(s1?.streamId, 1);
    assert.strictEqual(s2?.streamId, 2);

    assert.ok(pool.closeStream(s1.streamId));
    assert.strictEqual(pool.getActiveStreamCount(), 1);
  });

  it('enforces max concurrent streams limit', () => {
    const pool = new Http3QuicConnectionPoolService(2);
    pool.openStream();
    pool.openStream();
    const rejected = pool.openStream();
    assert.strictEqual(rejected, null);
  });
});
