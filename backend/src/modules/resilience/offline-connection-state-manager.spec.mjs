import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { OfflineConnectionStateManagerService } from './offline-connection-state-manager.service.ts';

describe('OfflineConnectionStateManagerService [L2-ERROR-RETRY-OFFLINE-052]', () => {
  const manager = new OfflineConnectionStateManagerService();

  test('transitions to OFFLINE and shows alert banner', () => {
    manager.setOffline();
    assert.equal(manager.getState(), 'OFFLINE');
    assert.equal(manager.isBannerVisible(), true);
  });

  test('buffers actions while offline and drains upon reconnecting to ONLINE', () => {
    manager.setOffline();
    manager.bufferAction({ type: 'SUBMIT_CODE', payload: { code: 'let x = 1;' } });
    assert.equal(manager.getBufferedCount(), 1);

    const drained = manager.setOnline();
    assert.equal(manager.getState(), 'ONLINE');
    assert.equal(manager.isBannerVisible(), false);
    assert.equal(drained.length, 1);
    assert.equal(drained[0].type, 'SUBMIT_CODE');
    assert.equal(manager.getBufferedCount(), 0);
  });
});
