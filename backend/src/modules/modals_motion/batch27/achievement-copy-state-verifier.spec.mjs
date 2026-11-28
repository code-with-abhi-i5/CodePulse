import test from 'node:test';
import assert from 'node:assert/strict';
import { AchievementCopyStateVerifier } from './achievement-copy-state-verifier.service.ts';

test('AchievementCopyStateVerifier [L2-MODAL-A11Y-MOTION-048]', async (t) => {
  const verifier = new AchievementCopyStateVerifier();

  await t.test('verifies accurate URL payload preservation', () => {
    const url = 'https://codepulse.io/achievements/123';
    assert.equal(verifier.verifyClipboardCopy(url, url), true);
    assert.equal(verifier.verifyClipboardCopy(url, 'other'), false);
    assert.equal(verifier.verifyClipboardCopy('', ''), false);
  });
});
