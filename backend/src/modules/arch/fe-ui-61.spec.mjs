import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FrontendIdleTimeoutCoordinatorService } from './fe-ui-61.service.ts';

describe('FrontendIdleTimeoutCoordinatorService (FE-UI-61)', () => {
  it('transitions from ACTIVE to WARNING and EXPIRED', () => {
    // 10s warning, 15s expiry
    const coord = new FrontendIdleTimeoutCoordinatorService(10000, 15000);
    coord.recordActivity(1000);

    assert.strictEqual(coord.getState(5000), 'ACTIVE');
    assert.strictEqual(coord.getState(12000), 'WARNING');
    assert.strictEqual(coord.getState(17000), 'EXPIRED');
  });

  it('resets timer back to ACTIVE on user activity during warning', () => {
    const coord = new FrontendIdleTimeoutCoordinatorService(10000, 15000);
    coord.recordActivity(1000);
    assert.strictEqual(coord.getState(12000), 'WARNING');

    coord.recordActivity(13000);
    assert.strictEqual(coord.getState(14000), 'ACTIVE');
  });
});
