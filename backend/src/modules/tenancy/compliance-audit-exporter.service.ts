import { AuditRecord } from '../../types/tenancy';

export class ComplianceAuditExporter {
  serializeToParquetBatch(records: AuditRecord[]): { batchId: string; rowCount: number; s3Key: string; schemaVersion: string } {
    if (!records || records.length === 0) {
      throw new Error('Audit batch cannot be empty');
    }
    const tenantId = records[0].tenantId;
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const s3Key = `audit-logs/tenant=${tenantId}/year=${year}/month=${month}/batch_${Date.now()}.parquet`;

    return {
      batchId: `batch_${Date.now()}_${records.length}`,
      rowCount: records.length,
      s3Key,
      schemaVersion: '1.2.0'
    };
  }

  filterRecordsByCompliance(records: AuditRecord[], allowedActionPrefixes: string[]): AuditRecord[] {
    return records.filter(r => allowedActionPrefixes.some(prefix => r.action.startsWith(prefix)));
  }
}
