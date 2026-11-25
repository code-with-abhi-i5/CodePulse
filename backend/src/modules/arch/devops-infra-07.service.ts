/**
 * Architecture Service: Automated Database Backup Verification Daemon
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-07]
 */

export interface SnapshotMetadata {
  snapshotId: string;
  sizeBytes: number;
  checksum: string;
  createdAt: number;
}

export interface VerificationReport {
  snapshotId: string;
  verified: boolean;
  restoredTablesCount: number;
  totalRecordsCount: number;
  durationMs: number;
  errors: string[];
}

export class BackupVerificationDaemonService {
  private verifiedSnapshots: Map<string, VerificationReport>;

  constructor() {
    this.verifiedSnapshots = new Map();
  }

  public async verifySnapshot(
    meta: SnapshotMetadata,
    restoreSandboxExecutor: (snap: SnapshotMetadata) => Promise<{ tables: number; records: number; err?: string }>
  ): Promise<VerificationReport> {
    const start = Date.now();
    const errors: string[] = [];

    if (!meta.checksum || meta.sizeBytes <= 0) {
      errors.push('Corrupt snapshot header: invalid checksum or size');
      return {
        snapshotId: meta.snapshotId,
        verified: false,
        restoredTablesCount: 0,
        totalRecordsCount: 0,
        durationMs: Date.now() - start,
        errors
      };
    }

    try {
      const res = await restoreSandboxExecutor(meta);
      if (res.err) errors.push(res.err);

      const report: VerificationReport = {
        snapshotId: meta.snapshotId,
        verified: errors.length === 0 && res.tables > 0,
        restoredTablesCount: res.tables,
        totalRecordsCount: res.records,
        durationMs: Date.now() - start,
        errors
      };
      this.verifiedSnapshots.set(meta.snapshotId, report);
      return report;
    } catch (e: any) {
      errors.push(e?.message || 'Restore sandbox exception');
      return {
        snapshotId: meta.snapshotId,
        verified: false,
        restoredTablesCount: 0,
        totalRecordsCount: 0,
        durationMs: Date.now() - start,
        errors
      };
    }
  }

  public getReport(snapshotId: string): VerificationReport | undefined {
    return this.verifiedSnapshots.get(snapshotId);
  }
}
