import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DynamicThemeHydratorService } from './fe-ui-12.service.ts';

describe('DynamicThemeHydratorService (FE-UI-12)', () => {
  it('generates CSS variables for themes and inline zero-flash hydration script', () => {
    const hydrator = new DynamicThemeHydratorService();
    const darkCss = hydrator.generateCssVariables('dark');
    assert.ok(darkCss.includes('--bg-primary: #0d1117;'));
    assert.ok(darkCss.includes('--text-primary: #c9d1d9;'));

    const lightCss = hydrator.generateCssVariables('light');
    assert.ok(lightCss.includes('--bg-primary: #ffffff;'));

    const script = hydrator.generateInlineHydrationScript();
    assert.ok(script.includes("localStorage.getItem('codepulse-theme')"));
    assert.ok(script.includes("document.documentElement.setAttribute('data-theme'"));
  });
});
