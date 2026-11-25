import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClientClipboardManagerService } from './fe-ui-58.service.ts';

describe('ClientClipboardManagerService (FE-UI-58)', () => {
  it('copies text and returns toast confirmation', () => {
    const mgr = new ClientClipboardManagerService();
    const res = mgr.copyText('const answer = 42;');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.toast.variant, 'success');
    assert.strictEqual(mgr.getHistory().length, 1);
  });

  it('redacts sensitive API tokens before adding to history', () => {
    const mgr = new ClientClipboardManagerService();
    const token = 'ghp_' + 'a'.repeat(36);
    const res = mgr.copyText('const secret = "' + token + '";');
    assert.ok(res.sanitized.includes('[REDACTED_GITHUB_TOKEN]'));
    assert.ok(!res.sanitized.includes(token));
  });
});
