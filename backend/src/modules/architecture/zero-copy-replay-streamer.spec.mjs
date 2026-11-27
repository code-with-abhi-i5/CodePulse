import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ZeroCopyReplayStreamerService } from './zero-copy-replay-streamer.service.ts';

describe('ZeroCopyReplayStreamerService [ARCH-CORE-038]', () => {
  const streamer = new ZeroCopyReplayStreamerService();
  const testBuffer = Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

  test('streams full buffer when range header is absent', async () => {
    const res = streamer.streamBuffer(testBuffer, undefined, 'video/mp4');
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['Content-Length'], testBuffer.length);
    assert.equal(res.headers['Content-Type'], 'video/mp4');

    const chunks = [];
    for await (const chunk of res.stream) {
      chunks.push(chunk);
    }
    assert.equal(Buffer.concat(chunks).toString(), testBuffer.toString());
  });

  test('parses and streams partial byte range correctly with 206 status', async () => {
    const res = streamer.streamBuffer(testBuffer, 'bytes=0-4');
    assert.equal(res.statusCode, 206);
    assert.equal(res.headers['Content-Range'], `bytes 0-4/${testBuffer.length}`);
    assert.equal(res.headers['Content-Length'], 5);

    const chunks = [];
    for await (const chunk of res.stream) {
      chunks.push(chunk);
    }
    assert.equal(Buffer.concat(chunks).toString(), 'ABCDE');
  });

  test('parses suffix byte range format (e.g. bytes=-5)', () => {
    const range = streamer.parseRangeHeader('bytes=-5', 36);
    assert.ok(range);
    assert.equal(range.start, 31);
    assert.equal(range.end, 35);
    assert.equal(range.chunkSize, 5);
  });

  test('returns 200 full content if invalid range requested', () => {
    const res = streamer.streamBuffer(testBuffer, 'bytes=999-1000');
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['Content-Length'], testBuffer.length);
  });
});
