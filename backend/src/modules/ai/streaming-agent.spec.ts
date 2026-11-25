import assert from 'node:assert/strict';
import test from 'node:test';

class StreamingAgentService {
  constructor() {
    this.activeStreams = new Set();
  }

  startStream(streamId) { this.activeStreams.add(streamId); }
  cancelStream(streamId) { return this.activeStreams.delete(streamId); }
  isStreamActive(streamId) { return this.activeStreams.has(streamId); }

  tokenizeMessage(text) {
    const words = text.split(' ');
    return words.map((w, idx) => ({
      token: w + ' ',
      index: idx,
      done: idx === words.length - 1
    }));
  }
}

test('StreamingAgentService: tokenizes messages for SSE streaming and supports mid-flight cancellation', () => {
  const agent = new StreamingAgentService();
  agent.startStream('sse-1');
  assert.equal(agent.isStreamActive('sse-1'), true);

  const tokens = agent.tokenizeMessage('Analyzing algorithmic complexity');
  assert.equal(tokens.length, 3);
  assert.equal(tokens[2].done, true);

  agent.cancelStream('sse-1');
  assert.equal(agent.isStreamActive('sse-1'), false);
});
