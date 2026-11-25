import { MeteringRecord } from '../../types/tenancy';

export class TenantUsageMeteringDaemon {
  private computeRatePerSec: number = 0.00002;
  private memoryRatePerMbSec: number = 0.000005;
  private storageRatePerGbMonth: number = 0.05;

  calculateBillableUsage(tenantId: string, computeSeconds: number, memoryMbSeconds: number, storageGigabytes: number): MeteringRecord {
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
