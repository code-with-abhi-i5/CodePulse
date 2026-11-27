import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportRetryGovernor } from './viewport-retry-governor.service.ts';

test('ViewportRetryGovernor [L2-ERROR-RETRY-OFFLINE-013]', async (t) => {
  await t.test('adjusts retry interval with jitter and higher base for cellular', () => {
    const gov = new ViewportRetryGovernor();
    const wifiDelay = gov.getRetryInterval(1, false);
    assert.ok(wifiDelay >= 2000 && wifiDelay < 2500);

    const cellularDelay = gov.getRetryInterval(1, true);
    assert.ok(cellularDelay >= 3000 && cellularDelay < 3500);
  });
});
