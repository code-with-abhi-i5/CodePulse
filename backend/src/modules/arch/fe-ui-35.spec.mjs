import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DebouncedFormValidationEngineService } from './fe-ui-35.service.ts';

describe('DebouncedFormValidationEngineService (FE-UI-35)', () => {
  it('validates synchronous form rules and resolves async uniqueness', async () => {
    const engine = new DebouncedFormValidationEngineService(['alice', 'bob']);

    // Sync fail
    assert.strictEqual(engine.validateSync('a').valid, false);
    assert.strictEqual(engine.validateSync('valid_user').valid, true);

    // Async taken
    const res1 = await engine.validateAsyncUniqueness('alice');
    assert.strictEqual(res1.available, false);
    assert.match(res1.error, /already taken/i);

    // Async available
    const res2 = await engine.validateAsyncUniqueness('charlie');
    assert.strictEqual(res2.available, true);
  });
});
