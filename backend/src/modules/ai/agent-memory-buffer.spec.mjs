import test from 'node:test';
import assert from 'node:assert/strict';

class AgentMemoryBuffer {
  constructor() {
    this.buffer = new Map();
  }

  recordMistake(userId, category, hintGiven) {
    if (!this.buffer.has(userId)) {
      this.buffer.set(userId, []);
    }
    const list = this.buffer.get(userId);
    const existing = list.find(r => r.category === category);
    if (existing) {
      existing.frequency++;
      existing.lastEncounteredAt = Date.now();
      existing.hintGiven = hintGiven;
    } else {
      list.push({
        userId,
        category,
        frequency: 1,
        lastEncounteredAt: Date.now(),
        hintGiven
      });
    }
  }

  getTopMistakes(userId) {
    const list = this.buffer.get(userId) || [];
    return [...list].sort((a, b) => b.frequency - a.frequency);
  }

  clearUserMemory(userId) {
    this.buffer.delete(userId);
  }
}

test('AgentMemoryBuffer - stores recurring user mistakes across training sessions', () => {
  const mem = new AgentMemoryBuffer();
  mem.recordMistake('u-123', 'off_by_one', 'Check array boundary at length - 1');
  mem.recordMistake('u-123', 'off_by_one', 'Check loop index bounds');
  mem.recordMistake('u-123', 'syntax', 'Missing closing parenthesis');

  const top = mem.getTopMistakes('u-123');
  assert.strictEqual(top[0].category, 'off_by_one');
  assert.strictEqual(top[0].frequency, 2);

  mem.clearUserMemory('u-123');
  assert.strictEqual(mem.getTopMistakes('u-123').length, 0);
});
