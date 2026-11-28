import test from 'node:test';
import assert from 'node:assert/strict';

class StreamingBackpressureBufferService {
  constructor(highWaterMark = 100, lowWaterMark = 20) {
    this.buffer = [];
    this.currentBytes = 0;
    this.highWaterMark = highWaterMark;
    this.lowWaterMark = lowWaterMark;
  }

  pushChunk(chunk) {
    const bytes = Buffer.byteLength(chunk, 'utf8');
    this.buffer.push(chunk);
    this.currentBytes += bytes;
    return this.currentBytes < this.highWaterMark;
  }

  getState() {
    return {
      bufferSizeBytes: this.currentBytes,
      highWaterMarkBytes: this.highWaterMark,
      isPaused: this.currentBytes >= this.highWaterMark
    };
  }
}

test('StreamingBackpressureBufferService - pauses ingestion when high water mark is reached', () => {
  const buf = new StreamingBackpressureBufferService(50, 10);
  const ok1 = buf.pushChunk('small chunk');
  assert.equal(ok1, true);

  const overflow = buf.pushChunk('A'.repeat(60));
  assert.equal(overflow, false);
  assert.equal(buf.getState().isPaused, true);
});
