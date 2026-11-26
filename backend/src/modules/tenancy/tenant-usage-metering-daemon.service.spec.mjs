import test from 'node:test';
import assert from 'node:assert/strict';

class TenantUsageMeteringDaemon {
  constructor() {
    this.computeRatePerSec = 0.00002;
    this.memoryRatePerMbSec = 0.000005;
    this.storageRatePerGbMonth = 0.05;
  }

  calculateBillableUsage(tenantId, computeSeconds, memoryMbSeconds, storageGigabytes) {
    const computeCost = computeSeconds * this.computeRatePerSec;
    const memoryCost = memoryMbSeconds * this.memoryRatePerMbSec;
    const storageCost = storageGigabytes * this.storageRatePerGbMonth;
    const calculatedCostUsd = Number((computeCost + memoryCost + storageCost).toFixed(4));

    return {
      tenantId,
      computeSeconds,
      memoryMbSeconds,
      storageGigabytes,
      calculatedCostUsd
    };
  }
}

test('TenantUsageMeteringDaemon - meters execution and computes USD resource costs', () => {
  const daemon = new TenantUsageMeteringDaemon();
  const usage = daemon.calculateBillableUsage('tenant_premium', 100000, 200000, 50);
  assert.strictEqual(usage.computeSeconds, 100000);
  assert.strictEqual(usage.calculatedCostUsd, 5.5);
});
