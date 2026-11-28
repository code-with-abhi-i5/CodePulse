import test from 'node:test';
import assert from 'node:assert/strict';
import { GranularErrorBoundaryManager } from './granular-error-boundary-manager.service.ts';

test('GranularErrorBoundaryManager [L2-ERROR-RETRY-OFFLINE-001]', async (t) => {
  const mgr = new GranularErrorBoundaryManager();

  await t.test('categorizes network and chunk errors with recovery actions', () => {
    const netErr = mgr.categorizeError(new Error('Network request failed'));
    assert.equal(netErr.type, 'network');
    assert.equal(netErr.recoverable, true);

    const chunkErr = mgr.categorizeError(new Error('Loading chunk 42 failed'));
    assert.equal(chunkErr.type, 'chunk_load');
    assert.equal(chunkErr.action, 'Reload page');
  });

  await t.test('categorizes authentication errors as non-recoverable without re-auth', () => {
    const authErr = mgr.categorizeError(new Error('User unauthorized token expired'));
    assert.equal(authErr.type, 'authentication');
    assert.equal(authErr.recoverable, false);
  });
});
