import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AdaptiveImageLoaderService } from './fe-ui-40.service.ts';

describe('AdaptiveImageLoaderService (FE-UI-40)', () => {
  it('selects best format based on client capabilities', () => {
    const loader = new AdaptiveImageLoaderService();
    const fmt1 = loader.selectBestFormat(['avif', 'webp'], '4g', false);
    assert.strictEqual(fmt1, 'avif');

    const fmt2 = loader.selectBestFormat(['webp'], '4g', false);
    assert.strictEqual(fmt2, 'webp');

    const fmt3 = loader.selectBestFormat([], '4g', false);
    assert.strictEqual(fmt3, 'jpeg');
  });

  it('adjusts quality and cuts high-res widths on slow connections or saveData', () => {
    const loader = new AdaptiveImageLoaderService();
    const res = loader.generateResponsiveSources('/hero.png', [320, 640, 1024, 1920], '2g', false, ['webp']);
    assert.strictEqual(res.quality, 55);
    assert.strictEqual(res.format, 'webp');
    assert.ok(!res.srcSet.includes('1920w'));
    assert.ok(res.srcSet.includes('640w'));
  });
});
