import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StaticAssetCacheControlService } from './perf-scale-16.service.ts';

describe('StaticAssetCacheControlService (PERF-SCALE-16)', () => {
  it('applies immutable 1-year cache directive to content-hashed assets', () => {
    const governor = new StaticAssetCacheControlService();
    const directives = governor.resolveDirectives('/_next/static/chunks/main.a1b2c3d4.js', 'hash123');
    assert.strictEqual(directives.cacheControl, 'public, max-age=31536000, immutable');
    assert.strictEqual(directives.etag, '"hash123"');
  });

  it('applies no-cache directive to html entrypoints and json manifests', () => {
    const governor = new StaticAssetCacheControlService();
    const htmlDir = governor.resolveDirectives('/index.html');
    assert.strictEqual(htmlDir.cacheControl, 'no-cache, no-store, must-revalidate');

    const jsonDir = governor.resolveDirectives('/manifest.json');
    assert.strictEqual(jsonDir.cacheControl, 'no-cache, no-store, must-revalidate');
  });
});
