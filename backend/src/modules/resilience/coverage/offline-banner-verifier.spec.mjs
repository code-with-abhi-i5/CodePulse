import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { OfflineBannerStateVerifier } from './offline-banner-verifier.service.ts';

describe('OfflineBannerStateVerifier [L2-ERROR-RETRY-OFFLINE-042]', () => {
  const verifier = new OfflineBannerStateVerifier();

  test('controls banner rendering state based on network and dismissal status', () => {
    assert.equal(verifier.shouldRenderBanner(), false);

    verifier.setStatus(false);
    assert.equal(verifier.shouldRenderBanner(), true);

    verifier.dismiss();
    assert.equal(verifier.shouldRenderBanner(), false);

    verifier.setStatus(true);
    assert.equal(verifier.shouldRenderBanner(), false);
  });
});
