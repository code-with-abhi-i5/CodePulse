import test from 'node:test';
import assert from 'node:assert/strict';
import { NotFoundQuicklinkResolver } from './not-found-quicklink-resolver.service.ts';

test('NotFoundQuicklinkResolver [L2-ERROR-RETRY-OFFLINE-004]', async (t) => {
  const resolver = new NotFoundQuicklinkResolver();

  await t.test('matches closest route for mistyped path', () => {
    const suggestions = resolver.findSuggestedLinks('/chlngs');
    assert.ok(suggestions.includes('/challenges'));
  });

  await t.test('returns default fallback links when path is empty', () => {
    const suggestions = resolver.findSuggestedLinks('', 2);
    assert.equal(suggestions.length, 2);
    assert.equal(suggestions[0], '/dashboard');
  });
});
