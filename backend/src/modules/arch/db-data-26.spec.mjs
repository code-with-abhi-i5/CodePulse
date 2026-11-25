import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseConnectionLeakWatchdogService } from './db-data-26.service.ts';

describe('DatabaseConnectionLeakWatchdogService (DB-DATA-26)', () => {
  it('detects unclosed client connection checkouts with stack traces', () => {
    const watchdog = new DatabaseConnectionLeakWatchdogService(1000);

    watchdog.checkoutConnection('conn-1');
    watchdog.checkoutConnection('conn-2');
    watchdog.releaseConnection('conn-1');

    const leaks = watchdog.detectLeaks(Date.now() + 2000);
    assert.strictEqual(leaks.length, 1);
    assert.strictEqual(leaks[0].connectionId, 'conn-2');
    assert.ok(leaks[0].exceededMs >= 1000);
  });
});
