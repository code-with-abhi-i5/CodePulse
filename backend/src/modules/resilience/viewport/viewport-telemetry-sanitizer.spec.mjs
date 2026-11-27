import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportTelemetrySanitizer } from './viewport-telemetry-sanitizer.service.ts';

test('ViewportTelemetrySanitizer [L2-ERROR-RETRY-OFFLINE-017]', async (t) => {
  await t.test('scrubs credentials and tags tablet viewport dimension', () => {
    const sanitizer = new ViewportTelemetrySanitizer();
    const result = sanitizer.scrubAndAttachViewport({
      token: 'jwt-123',
      email: 'user@pulse.io',
      error: 'ChunkLoadError'
    }, 768, 1024);

    assert.equal(result.token, undefined);
    assert.equal(result.email, undefined);
    assert.equal(result.error, 'ChunkLoadError');
    assert.equal(result.viewport.deviceType, 'tablet');
  });
});
