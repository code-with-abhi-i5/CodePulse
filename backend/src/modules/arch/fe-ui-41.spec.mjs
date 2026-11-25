import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AccessibleColorSchemeService } from './fe-ui-41.service.ts';

describe('AccessibleColorSchemeService (FE-UI-41)', () => {
  it('calculates WCAG contrast ratio accurately for black on white', () => {
    const service = new AccessibleColorSchemeService();
    const result = service.verifyContrast('#000000', '#ffffff');
    assert.strictEqual(result.ratio, 21);
    assert.strictEqual(result.wcagAA, true);
    assert.strictEqual(result.wcagAAA, true);
  });

  it('detects low contrast colors failing WCAG AA', () => {
    const service = new AccessibleColorSchemeService();
    const result = service.verifyContrast('#888888', '#ffffff');
    assert.ok(result.ratio < 4.5);
    assert.strictEqual(result.wcagAA, false);
    assert.strictEqual(result.wcagAAA, false);
  });

  it('suggests high-contrast alternatives', () => {
    const service = new AccessibleColorSchemeService();
    const altOnDark = service.getHighContrastAlternative('#333333', '#111111');
    assert.strictEqual(altOnDark, '#ffffff');

    const altOnLight = service.getHighContrastAlternative('#cccccc', '#f9f9f9');
    assert.strictEqual(altOnLight, '#000000');
  });
});
