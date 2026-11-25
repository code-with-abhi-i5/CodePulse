import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CollaborativeCursorInterpolatorService } from './fe-ui-15.service.ts';

describe('CollaborativeCursorInterpolatorService (FE-UI-15)', () => {
  it('smoothly interpolates cursor positions between jittery network packets', () => {
    const interpolator = new CollaborativeCursorInterpolatorService();

    interpolator.updateTarget({ x: 0, y: 0, timestamp: 1000 });
    interpolator.updateTarget({ x: 100, y: 200, timestamp: 1100 });

    const mid = interpolator.interpolate(0.5);
    assert.strictEqual(mid.x, 50);
    assert.strictEqual(mid.y, 100);

    const end = interpolator.interpolate(1.0);
    assert.strictEqual(end.x, 100);
    assert.strictEqual(end.y, 200);
  });
});
