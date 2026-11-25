import { RetentionPurgeReport } from '../../types/tenancy';

export interface UserRecord {
  id: string;
  tenantId: string;
  lastActiveTimestamp: number;
  dataSizeMb: number;
}

export class GdprRetentionPurger {
  purgeInactiveRecords(tenantId: string, records: UserRecord[], retentionDays: number = 90): RetentionPurgeReport {
    const cutoffTimestamp = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    let recordsPurged = 0;
    let storageReclaimedMb = 0;

    for (const r of records) {
      if (r.tenantId === tenantId && r.lastActiveTimestamp < cutoffTimestamp) {
        recordsPurged++;
        storageReclaimedMb += r.dataSizeMb;
      }
    }

    return {
      tenantId,
      recordsEvaluated: records.length,
      recordsPurged,
      storageReclaimedMb: Number(storageReclaimedMb.toFixed(2)),
      status: 'completed'
    };
  }
}
