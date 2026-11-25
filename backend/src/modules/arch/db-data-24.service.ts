/**
 * Architecture Service: Database Backup Snapshot Integrity Validator
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-24]
 */

export interface BackupMetadata {
  snapshotId: string;
  expectedTables: string[];
  expectedMinRowCount: number;
  checksum: string;
}

export class DatabaseBackupSnapshotValidatorService {
  public validateSnapshot(
    metadata: BackupMetadata,
    actualChecksum: string,
    restoredTableCounts: Record<string, number>
  ): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (actualChecksum !== metadata.checksum) {
      issues.push(`Checksum mismatch: expected ${metadata.checksum}, received ${actualChecksum}`);
    }

    let totalRows = 0;
    for (const table of metadata.expectedTables) {
      if (restoredTableCounts[table] === undefined) {
        issues.push(`Missing restored table: ${table}`);
      } else {
        totalRows += restoredTableCounts[table];
      }
    }

    if (totalRows < metadata.expectedMinRowCount) {
      issues.push(`Row count failure: total rows ${totalRows} < min expected ${metadata.expectedMinRowCount}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
