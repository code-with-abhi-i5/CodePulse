import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IpcSharedMemoryTransportService } from './perf-scale-19.service.ts';

describe('IpcSharedMemoryTransportService (PERF-SCALE-19)', () => {
  it('writes and reads messages via shared circular ring-buffer', () => {
    const transport = new IpcSharedMemoryTransportService(10);
    assert.strictEqual(transport.read(), null);

    assert.ok(transport.write('msg-1'));
    assert.ok(transport.write('msg-2'));
    assert.strictEqual(transport.getAvailableCount(), 2);

    assert.strictEqual(transport.read(), 'msg-1');
    assert.strictEqual(transport.read(), 'msg-2');
    assert.strictEqual(transport.read(), null);
  });
});
