import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CrossTabSyncCoordinatorService } from './fe-ui-05.service.ts';

describe('CrossTabSyncCoordinatorService (FE-UI-05)', () => {
  it('elects the eldest active browser tab as cluster leader and handles failover', () => {
    const tab1 = new CrossTabSyncCoordinatorService('tab_alpha');
    assert.strictEqual(tab1.isLocalTabLeader(), true);

    // Tab 2 joins later
    tab1.recordHeartbeat('tab_beta');
    assert.strictEqual(tab1.getLeaderId(), 'tab_alpha');

    // Tab 1 closes or dies -> failover to tab_beta
    tab1.removeTab('tab_alpha');
    assert.strictEqual(tab1.getLeaderId(), 'tab_beta');
  });
});
