import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoMultiFileTabManagerService } from './fe-ui-62.service.ts';

describe('MonacoMultiFileTabManagerService (FE-UI-62)', () => {
  it('manages tabs and flags dirty state when modified', () => {
    const mgr = new MonacoMultiFileTabManagerService();
    mgr.openTab('index.ts', 'index.ts', 'console.log("hello");');
    assert.strictEqual(mgr.getActiveTab()?.isDirty, false);

    mgr.updateContent('index.ts', 'console.log("modified");');
    assert.strictEqual(mgr.getActiveTab()?.isDirty, true);

    mgr.saveTab('index.ts');
    assert.strictEqual(mgr.getActiveTab()?.isDirty, false);
  });

  it('prompts confirmation when closing dirty tab without force', () => {
    const mgr = new MonacoMultiFileTabManagerService();
    mgr.openTab('style.css', 'style.css', 'body { margin: 0; }');
    mgr.updateContent('style.css', 'body { margin: 10px; }');

    const res = mgr.closeTab('style.css', false);
    assert.strictEqual(res.closed, false);
    assert.strictEqual(res.promptConfirmation, true);

    const forceRes = mgr.closeTab('style.css', true);
    assert.strictEqual(forceRes.closed, true);
    assert.strictEqual(mgr.getActiveTab(), null);
  });
});
