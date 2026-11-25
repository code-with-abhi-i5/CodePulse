import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClientMemoryLeakWatchdogService } from './fe-ui-17.service.ts';

describe('ClientMemoryLeakWatchdogService (FE-UI-17)', () => {
  it('tracks event listeners and alerts on uncleaned listeners during component unmount', () => {
    const watchdog = new ClientMemoryLeakWatchdogService();

    watchdog.registerListener('lis_1', {
      componentId: 'BattleArena',
      eventType: 'keydown',
      elementTag: 'window',
      registeredAt: Date.now()
    });
    watchdog.registerListener('lis_2', {
      componentId: 'BattleArena',
      eventType: 'resize',
      elementTag: 'window',
      registeredAt: Date.now()
    });

    assert.strictEqual(watchdog.getActiveListenerCount(), 2);

    // Properly unregister lis_1
    watchdog.unregisterListener('lis_1');

    // Component unmounts with lis_2 still attached
    const audit = watchdog.auditComponentUnmount('BattleArena');
    assert.strictEqual(audit.leakedCount, 1);
    assert.strictEqual(audit.leakedListeners[0].eventType, 'resize');
    assert.strictEqual(watchdog.getActiveListenerCount(), 0);
  });
});
