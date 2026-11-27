import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GranularErrorBoundaryHandlerService } from './granular-error-boundary-handler.service.ts';

describe('GranularErrorBoundaryHandlerService [L2-ERROR-RETRY-OFFLINE-051]', () => {
  test('captures error state and allows retry within threshold', () => {
    const handler = new GranularErrorBoundaryHandlerService(2);
    handler.captureError(new Error('Syntax rendering failed'));

    assert.equal(handler.getState().hasError, true);
    const retry1 = handler.retry();
    assert.equal(retry1.success, true);
    assert.equal(handler.getState().hasError, false);
  });

  test('disallows retry when max retry count is exceeded', () => {
    const handler = new GranularErrorBoundaryHandlerService(1);
    handler.captureError(new Error('Fatal'));
    handler.retry(); // attempt 1

    handler.captureError(new Error('Fatal again'));
    const retry2 = handler.retry();
    assert.equal(retry2.canRetry, false);
  });
});
