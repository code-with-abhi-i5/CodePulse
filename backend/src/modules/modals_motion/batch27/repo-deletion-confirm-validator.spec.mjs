import test from 'node:test';
import assert from 'node:assert/strict';
import { RepoDeletionConfirmValidator } from './repo-deletion-confirm-validator.service.ts';

test('RepoDeletionConfirmValidator [L2-MODAL-A11Y-MOTION-055]', async (t) => {
  const validator = new RepoDeletionConfirmValidator();

  await t.test('rejects mismatched or empty confirmation string', () => {
    assert.equal(validator.validateConfirmation('code-pulse', '').isValid, false);
    assert.equal(validator.validateConfirmation('code-pulse', 'wrong-repo').isValid, false);
    assert.equal(validator.validateConfirmation('', 'code-pulse').isValid, false);
  });

  await t.test('approves exact trimmed matching repository name', () => {
    assert.equal(validator.validateConfirmation('code-pulse', 'code-pulse').isValid, true);
    assert.equal(validator.validateConfirmation('code-pulse', '  code-pulse  ').isValid, true);
  });
});
