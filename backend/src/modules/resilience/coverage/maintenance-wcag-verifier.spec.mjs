import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MaintenanceRedirectWcagVerifier } from './maintenance-wcag-verifier.service.ts';

describe('MaintenanceRedirectWcagVerifier [L2-ERROR-RETRY-OFFLINE-040]', () => {
  const verifier = new MaintenanceRedirectWcagVerifier();

  test('formats WCAG 2.1 AA accessible maintenance alert with ARIA roles', () => {
    const alert = verifier.generateAccessibleAlert(180, 'Scheduled platform upgrade');
    assert.equal(alert.role, 'alert');
    assert.equal(alert.ariaLive, 'assertive');
    assert.ok(alert.text.includes('180 seconds'));
    assert.equal(alert.hasHighContrast, true);
  });
});
