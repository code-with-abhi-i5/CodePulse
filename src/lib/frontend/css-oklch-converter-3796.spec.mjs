import assert from 'node:assert/strict';
import { CssOklchGamutConverterService_3796 } from './css-oklch-converter-3796.service.ts';
const svc = new CssOklchGamutConverterService_3796();
const css = svc.formatCss({ l: 0.7, c: 0.15, h: 120 });
assert.equal(css, 'oklch(70.0% 0.150 120.0)');
console.log('Test passed for #3796');