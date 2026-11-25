import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationPermissionManagerService } from './fe-ui-48.service.ts';

describe('NotificationPermissionManagerService (FE-UI-48)', () => {
  it('suppresses contextual prompts until engagement threshold is reached', () => {
    const mgr = new NotificationPermissionManagerService(3, 1000);
    assert.strictEqual(mgr.shouldShowContextualPrompt(), false);

    mgr.recordEngagementAction();
    mgr.recordEngagementAction();
    assert.strictEqual(mgr.shouldShowContextualPrompt(), false);

    mgr.recordEngagementAction();
    assert.strictEqual(mgr.shouldShowContextualPrompt(), true);
  });

  it('enforces cooldown period after user dismisses prompt', () => {
    const mgr = new NotificationPermissionManagerService(1, 5000);
    mgr.recordEngagementAction();
    assert.strictEqual(mgr.shouldShowContextualPrompt(1000), true);

    mgr.dismissPrompt(1000);
    assert.strictEqual(mgr.shouldShowContextualPrompt(2000), false);
    assert.strictEqual(mgr.shouldShowContextualPrompt(7000), true);
  });
});
