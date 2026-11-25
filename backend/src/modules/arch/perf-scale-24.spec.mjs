import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClusterRollingRestartService } from './perf-scale-24.service.ts';

describe('ClusterRollingRestartService (PERF-SCALE-24)', () => {
  it('detects workers exceeding memory threshold and executes rolling replacement', () => {
    const manager = new ClusterRollingRestartService(500000000); // 500MB
    manager.registerWorker(1, 1001, 300000000);
    manager.registerWorker(2, 1002, 600000000); // bloated

    const bloated = manager.getBloatedWorkerIds();
    assert.deepStrictEqual(bloated, [2]);

    const restarted = manager.restartNextWorker(2002);
    assert.strictEqual(restarted?.oldWorkerId, 2);
    assert.strictEqual(restarted?.newPid, 2002);

    assert.deepStrictEqual(manager.getBloatedWorkerIds(), []);
  });
});
