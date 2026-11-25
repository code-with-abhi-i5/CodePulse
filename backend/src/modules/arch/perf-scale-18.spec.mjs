import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ZeroCopyBufferSlicingPipelineService } from './perf-scale-18.service.ts';

describe('ZeroCopyBufferSlicingPipelineService (PERF-SCALE-18)', () => {
  it('parses length-prefixed protocol frames with zero-copy subarrays', () => {
    const pipeline = new ZeroCopyBufferSlicingPipelineService();

    // Frame 1: type 1, payload "hello" (5 bytes)
    // Frame 2: type 2, payload "world!" (6 bytes)
    const buf1 = Buffer.from('hello');
    const buf2 = Buffer.from('world!');

    const totalLen = (5 + buf1.length) + (5 + buf2.length);
    const buffer = Buffer.alloc(totalLen);

    let offset = 0;
    buffer.writeUInt32BE(buf1.length, offset);
    buffer.writeUInt8(1, offset + 4);
    buf1.copy(buffer, offset + 5);
    offset += 5 + buf1.length;

    buffer.writeUInt32BE(buf2.length, offset);
    buffer.writeUInt8(2, offset + 4);
    buf2.copy(buffer, offset + 5);

    const frames = pipeline.parseFrames(buffer);
    assert.strictEqual(frames.length, 2);
    assert.strictEqual(frames[0].type, 1);
    assert.strictEqual(frames[0].payload.toString('utf8'), 'hello');
    assert.strictEqual(frames[1].type, 2);
    assert.strictEqual(frames[1].payload.toString('utf8'), 'world!');
  });
});
