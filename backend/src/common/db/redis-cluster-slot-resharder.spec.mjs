import test from 'node:test';
import assert from 'node:assert/strict';

class RedisClusterSlotResharderService {
  planSlotMigration(slotId, sourceNode, destinationNode) {
    return { slotId, sourceNode, destinationNode, status: 'MIGRATING', keysMigrated: 0 };
  }
  generateCommands(slotId, sourceNode, destNode) {
    return [
      'CLUSTER SETSLOT ' + slotId + ' IMPORTING ' + sourceNode,
      'CLUSTER SETSLOT ' + slotId + ' MIGRATING ' + destNode,
      'CLUSTER SETSLOT ' + slotId + ' NODE ' + destNode
    ];
  }
}

test('RedisClusterSlotResharderService - plans and orchestrates cluster slot migration', () => {
  const resharder = new RedisClusterSlotResharderService();
  const plan = resharder.planSlotMigration(5461, 'node-1', 'node-2');
  assert.equal(plan.slotId, 5461);
  assert.equal(plan.status, 'MIGRATING');

  const cmds = resharder.generateCommands(5461, 'node-1', 'node-2');
  assert.equal(cmds.length, 3);
  assert.ok(cmds[0].includes('IMPORTING'));
});
