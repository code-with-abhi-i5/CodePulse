import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PermessageDeflateOptimizerService } from './perf-scale-25.service.ts';

describe('PermessageDeflateOptimizerService (PERF-SCALE-25)', () => {
  it('tunes window bits and memory levels based on concurrent connection load', () => {
    const optimizer = new PermessageDeflateOptimizerService();
    const lowLoad = optimizer.resolveOptions(100);
    assert.strictEqual(lowLoad.zlibDeflateOptions.windowBits, 15);
    assert.strictEqual(lowLoad.thresholdBytes, 128);

    const highLoad = optimizer.resolveOptions(10000);
    assert.strictEqual(highLoad.zlibDeflateOptions.windowBits, 10);
    assert.strictEqual(highLoad.serverNoContextTakeover, true);
    assert.strictEqual(highLoad.thresholdBytes, 512);
  });

  it('bypasses compression on payloads smaller than threshold', () => {
    const optimizer = new PermessageDeflateOptimizerService();
    const opts = optimizer.resolveOptions(500);
    assert.strictEqual(optimizer.shouldCompress(64, opts), false);
    assert.strictEqual(optimizer.shouldCompress(256, opts), true);
  });
});
