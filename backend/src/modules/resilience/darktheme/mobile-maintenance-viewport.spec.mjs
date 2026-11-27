import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MobileMaintenanceViewportService } from './mobile-maintenance-viewport.service.ts';

describe('MobileMaintenanceViewportService [L2-ERROR-RETRY-OFFLINE-020]', () => {
  const v = new MobileMaintenanceViewportService();

  test('adjusts maintenance viewport metrics for tablet and mobile screens', () => {
    const mobile = v.getViewportAdjustments(400);
    assert.equal(mobile.isMobile, true);
    assert.equal(mobile.padding, '16px');

    const desktop = v.getViewportAdjustments(1024);
    assert.equal(desktop.isMobile, false);
    assert.equal(desktop.padding, '32px');
  });
});
