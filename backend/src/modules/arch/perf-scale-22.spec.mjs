import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AsyncLoggingRingBufferTransportService } from './perf-scale-22.service.ts';

describe('AsyncLoggingRingBufferTransportService (PERF-SCALE-22)', () => {
  it('buffers logs asynchronously and flushes in batches', () => {
    const transport = new AsyncLoggingRingBufferTransportService(10);
    transport.log('info', 'First log');
    transport.log('warn', 'Second log');

    assert.strictEqual(transport.getStats().pendingLogs, 2);
    const flushed = transport.flushBatch(5);
    assert.strictEqual(flushed.length, 2);
    assert.strictEqual(flushed[0].message, 'First log');
    assert.strictEqual(transport.getStats().pendingLogs, 0);
  });

  it('drops logs without blocking when capacity is exceeded', () => {
    const transport = new AsyncLoggingRingBufferTransportService(2);
    assert.strictEqual(transport.log('info', '1'), true);
    assert.strictEqual(transport.log('info', '2'), true);
    assert.strictEqual(transport.log('info', '3'), false); // dropped
    assert.strictEqual(transport.getStats().droppedCount, 1);
  });
});
