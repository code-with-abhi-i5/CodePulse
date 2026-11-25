import assert from 'node:assert/strict';
import { EarlyHintsCoordinatorService } from './perf-scale-37.service.ts';

const coordinator = new EarlyHintsCoordinatorService();

coordinator.registerRouteAssets('/dashboard', [
  { url: '/assets/theme.css', as: 'style' },
  { url: '/assets/main.bundle.js', as: 'script' },
  { url: '/fonts/inter.woff2', as: 'font' }
]);

const headers = coordinator.formatEarlyHintsHeaders('/dashboard');
assert.ok(headers);
assert.strictEqual(headers.Link.length, 3);
assert.strictEqual(headers.Link[0], '</assets/theme.css>; rel=preload; as=style');
assert.strictEqual(headers.Link[2], '</fonts/inter.woff2>; rel=preload; as=font; crossorigin');

assert.strictEqual(coordinator.formatEarlyHintsHeaders('/unknown'), null);
console.log('Issue #3072 [PERF-SCALE-37] spec passed successfully.');
