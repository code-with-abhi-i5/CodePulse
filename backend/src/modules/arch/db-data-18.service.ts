/**
 * Architecture Service: Foreign Key Integrity Verification Crawler
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-18]
 */

export interface TableRelation {
  childTable: string;
  childForeignKey: string;
  parentTable: string;
  parentPrimaryKey: string;
}

export class ForeignKeyIntegrityCrawlerService {
  public findOrphanedRows(
    relation: TableRelation,
    parentIds: Set<string | number>,
    childRows: Array<Record<string, any>>
  ): Array<{ childId: any; invalidForeignKey: any }> {
    const orphaned: Array<{ childId: any; invalidForeignKey: any }> = [];

    for (const row of childRows) {
      const fk = row[relation.childForeignKey];
      if (fk !== null && fk !== undefined && !parentIds.has(fk)) {
        orphaned.push({
          childId: row.id,
          invalidForeignKey: fk
        });
      }
    }

    return orphaned;
  }
}
