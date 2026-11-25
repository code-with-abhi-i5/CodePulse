import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Http2ServerPushCoordinatorService } from './api-int-37.service.ts';

describe('Http2ServerPushCoordinatorService (API-INT-37)', () => {
  it('generates Link preload headers for Monaco editor assets on challenge routes', () => {
    const coordinator = new Http2ServerPushCoordinatorService();
    coordinator.registerPreloads('/challenges', ['/static/monaco/editor.main.js', '/static/monaco/ts.worker.js']);

    const header = coordinator.getPreloadHeader('/challenges/123');
    assert.strictEqual(
      header,
      '</static/monaco/editor.main.js>; rel=preload; as=script, </static/monaco/ts.worker.js>; rel=preload; as=script'
    );
    assert.strictEqual(coordinator.getPreloadHeader('/settings'), null);
  });
});
