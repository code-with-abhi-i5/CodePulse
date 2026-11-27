import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WcagNotFoundNavigationA11y } from './wcag-not-found-a11y.service.ts';

describe('WcagNotFoundNavigationA11y [L2-ERROR-RETRY-OFFLINE-034]', () => {
  const a11y = new WcagNotFoundNavigationA11y();

  test('returns standard accessible navigation and heading semantics', () => {
    const nav = a11y.getNavA11yProps();
    assert.equal(nav.role, 'navigation');
    assert.equal(nav.ariaLabel, 'Suggested Pages');

    const h = a11y.getHeadingAriaProps();
    assert.equal(h.ariaLevel, 1);
  });
});
