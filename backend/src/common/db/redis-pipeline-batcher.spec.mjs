import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class RedisPipelineBatcherService {
  computeHashSlot(key) {
    const tagMatch = key.match(/\{([^}]+)\}/);
    const target = tagMatch ? tagMatch[1] : key;
    let hash = 0;
    for (let i = 0; i < target.length; i++) {
      hash = (hash * 31 + target.charCodeAt(i)) % 16384;
    }
    return hash;
  }

  batchCommands(commands) {
    const slotsMap = new Map();

    for (const cmd of commands) {
      const slot = this.computeHashSlot(cmd.key);
      const existing = slotsMap.get(slot) || [];
      existing.push({
        command: cmd.command,
        args: [cmd.key, ...(cmd.args || [])]
      });
      slotsMap.set(slot, existing);
    }

    const batches = [];
    for (const [slot, cmds] of slotsMap.entries()) {
      batches.push({
        slot,
        commands: cmds,
        totalCommands: cmds.length
      });
    }

    return batches;
  }
}

describe('RedisPipelineBatcherService', () => {
  const batcher = new RedisPipelineBatcherService();

  it('computes consistent hash slots and respects hashtag braces', () => {
    const slotA = batcher.computeHashSlot('user:{1001}:profile');
    const slotB = batcher.computeHashSlot('user:{1001}:stats');
    assert.equal(slotA, slotB);
  });

  it('groups commands targeting the same slot into single pipeline batches', () => {
    const commands = [
      { command: 'HGETALL', key: 'user:{42}:meta' },
      { command: 'HGETALL', key: 'user:{42}:scores' },
      { command: 'GET', key: 'global:config' }
    ];

    const batches = batcher.batchCommands(commands);
    assert.equal(batches.length, 2);

    const slot42Batch = batches.find(b => b.commands.length === 2);
    assert.ok(slot42Batch);
    assert.equal(slot42Batch.totalCommands, 2);
  });
});
