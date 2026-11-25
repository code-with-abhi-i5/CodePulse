import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BundleSizeBudgetEnforcerService } from './fe-ui-27.service.ts';

describe('BundleSizeBudgetEnforcerService (FE-UI-27)', () => {
  it('enforces chunk size limits and total bundle budget', () => {
    const enforcer = new BundleSizeBudgetEnforcerService({
      maxVendorChunkBytes: 500000,
      maxAppChunkBytes: 200000,
      maxTotalBytes: 1000000
    });

    const good = enforcer.auditBundles([
      { name: 'app.js', sizeBytes: 150000 },
      { name: 'vendor.js', sizeBytes: 400000 }
    ]);
    assert.strictEqual(good.passed, true);

    const bad = enforcer.auditBundles([
      { name: 'app.js', sizeBytes: 250000 } // exceeds 200k
    ]);
    assert.strictEqual(bad.passed, false);
    assert.ok(bad.violations.some(v => v.includes("Chunk 'app.js'")));
  });
});
