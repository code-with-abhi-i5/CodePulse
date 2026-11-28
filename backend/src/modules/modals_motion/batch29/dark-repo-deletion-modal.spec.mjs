import test from 'node:test';
import assert from 'node:assert/strict';
import { DarkRepoDeletionModal } from './dark-repo-deletion-modal.service.ts';

test('DarkRepoDeletionModal [L2-MODAL-A11Y-MOTION-025]', async (t) => {
  const modal = new DarkRepoDeletionModal();

  await t.test('applies red error accent in dark theme when input is invalid', () => {
    const errorTheme = modal.getInputTheme(true);
    assert.equal(errorTheme.borderColor, '#ef4444');
    assert.equal(errorTheme.backgroundColor, '#111827');

    const normalTheme = modal.getInputTheme(false);
    assert.equal(normalTheme.borderColor, '#4b5563');
  });
});
