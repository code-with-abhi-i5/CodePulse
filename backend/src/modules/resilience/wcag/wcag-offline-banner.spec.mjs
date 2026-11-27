import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WcagOfflineBannerA11y } from './wcag-offline-banner.service.ts';

describe('WcagOfflineBannerA11y [L2-ERROR-RETRY-OFFLINE-032]', () => {
  const a11y = new WcagOfflineBannerA11y();

  test('provides accessible status live region for offline banner', () => {
    const props = a11y.getBannerProps();
    assert.equal(props.role, 'status');
    assert.equal(props.ariaLive, 'polite');
    assert.equal(props.ariaAtomic, true);
  });
});
