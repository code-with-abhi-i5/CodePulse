import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HighContrastMaintenanceThemeService } from './high-contrast-maintenance-theme.service.ts';

describe('HighContrastMaintenanceThemeService [L2-ERROR-RETRY-OFFLINE-030]', () => {
  const theme = new HighContrastMaintenanceThemeService();

  test('provides high-contrast theme conforming to WCAG AAA contrast ratio standards', () => {
    const conf = theme.getThemeConfig(true);
    assert.equal(conf.backgroundColor, '#000000');
    assert.equal(conf.textColor, '#FFFFFF');
    assert.equal(conf.contrastRatio, '21:1');
  });
});
