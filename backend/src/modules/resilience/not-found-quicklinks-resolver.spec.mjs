import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { NotFoundQuicklinksResolverService } from './not-found-quicklinks-resolver.service.ts';

describe('NotFoundQuicklinksResolverService [L2-ERROR-RETRY-OFFLINE-054]', () => {
  const resolver = new NotFoundQuicklinksResolverService();

  test('suggests closest route based on typo in requested path', () => {
    const suggestions = resolver.resolveSuggestions('/tournamnt');
    assert.equal(suggestions[0].path, '/tournaments');
  });

  test('suggests settings route for /settngs', () => {
    const suggestions = resolver.resolveSuggestions('/settngs');
    assert.equal(suggestions[0].path, '/settings');
  });

  test('falls back to default routes on empty path', () => {
    const suggestions = resolver.resolveSuggestions('');
    assert.equal(suggestions.length, 3);
  });
});
