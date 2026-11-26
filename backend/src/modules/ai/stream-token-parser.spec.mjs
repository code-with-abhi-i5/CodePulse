import test from 'node:test';
import assert from 'node:assert/strict';

class StreamTokenParser {
  constructor() {
    this.buffer = '';
    this.toolName = '';
  }

  appendChunk(chunk) {
    if (chunk.name) this.toolName = chunk.name;
    this.buffer += chunk.argumentFragment;

    try {
      const parsed = JSON.parse(this.buffer);
      return {
        isComplete: true,
        toolName: this.toolName,
        args: parsed,
        rawBuffer: this.buffer
      };
    } catch {
      return {
        isComplete: false,
        toolName: this.toolName,
        args: {},
        rawBuffer: this.buffer
      };
    }
  }

  reset() {
    this.buffer = '';
    this.toolName = '';
  }
}

test('StreamTokenParser - buffers streaming JSON chunks until valid object formed', () => {
  const parser = new StreamTokenParser();
  const chunk1 = parser.appendChunk({ index: 0, name: 'execute_test', argumentFragment: '{"testId":' });
  assert.strictEqual(chunk1.isComplete, false);

  const chunk2 = parser.appendChunk({ index: 0, argumentFragment: '"t-101"}' });
  assert.strictEqual(chunk2.isComplete, true);
  assert.strictEqual(chunk2.toolName, 'execute_test');
  assert.strictEqual(chunk2.args.testId, 't-101');
});
