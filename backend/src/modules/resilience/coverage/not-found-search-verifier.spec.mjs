import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { NotFoundQuicklinkSearchVerifier } from './not-found-search-verifier.service.ts';

describe('NotFoundQuicklinkSearchVerifier [L2-ERROR-RETRY-OFFLINE-044]', () => {
  const verifier = new NotFoundQuicklinkSearchVerifier();

  test('finds matching quick links based on query search', () => {
    const results = verifier.search('tourn');
    assert.equal(results.length, 1);
    assert.equal(results[0].path, '/tournaments');
  });

  test('returns top suggestions for empty search', () => {
    const results = verifier.search('');
    assert.equal(results.length, 2);
  });
});
