import assert from 'node:assert/strict';
import test from 'node:test';

class StreamRunnerService {
  constructor() {
    this.streams = new Map();
    this.subscribers = new Map();
  }

  createStreamBuffer(executionId, maxChunkBytes = 4096) {
    const buffer = { executionId, chunks: [], maxChunkBytes };
    this.streams.set(executionId, buffer);
    return buffer;
  }

  pushStdout(executionId, data) {
    return this.pushChunk(executionId, { stream: 'stdout', data, timestamp: Date.now() });
  }

  pushStderr(executionId, data) {
    return this.pushChunk(executionId, { stream: 'stderr', data, timestamp: Date.now() });
  }

  pushChunk(executionId, chunk) {
    let buf = this.streams.get(executionId);
    if (!buf) buf = this.createStreamBuffer(executionId);
    buf.chunks.push(chunk);
    const listeners = this.subscribers.get(executionId);
    if (listeners) listeners.forEach(fn => fn(chunk));
    return true;
  }

  flushToWebSocket(executionId) {
    const buf = this.streams.get(executionId);
    if (!buf) return [];
    const flushed = [...buf.chunks];
    buf.chunks = [];
    return flushed;
  }

  subscribeStream(executionId, listener) {
    if (!this.subscribers.has(executionId)) this.subscribers.set(executionId, []);
    this.subscribers.get(executionId).push(listener);
    return () => {
      this.subscribers.set(executionId, this.subscribers.get(executionId).filter(l => l !== listener));
    };
  }
}

test('StreamRunnerService: buffers stdout/stderr and triggers real-time subscribers', () => {
  const runner = new StreamRunnerService();
  const execId = 'exec-123';
  const received = [];

  const unsub = runner.subscribeStream(execId, (chunk) => received.push(chunk));
  runner.pushStdout(execId, 'Compiling program...\n');
  runner.pushStderr(execId, 'Warning: unused variable\n');

  assert.equal(received.length, 2);
  assert.equal(received[0].stream, 'stdout');
  assert.equal(received[1].stream, 'stderr');

  const flushed = runner.flushToWebSocket(execId);
  assert.equal(flushed.length, 2);
  assert.equal(runner.flushToWebSocket(execId).length, 0);
  unsub();
});
