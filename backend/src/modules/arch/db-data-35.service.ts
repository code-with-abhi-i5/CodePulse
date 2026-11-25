/**
 * Architecture Service: Dynamic Table Vacuum & Analyze Scheduler
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-35]
 */

export interface TableTupleStats {
  tableName: string;
  liveTuples: number;
  deadTuples: number;
}

export class TableVacuumAnalyzeSchedulerService {
  private deadTupleRatioThreshold: number;

  constructor(deadTupleRatioThreshold: number = 0.15) { // 15% dead tuple threshold
    this.deadTupleRatioThreshold = deadTupleRatioThreshold;
  }

  public evaluateTables(tables: TableTupleStats[]): Array<{
    tableName: string;
    deadRatio: number;
    recommendedDdl: string;
  }> {
    const scheduled: Array<{ tableName: string; deadRatio: number; recommendedDdl: string }> = [];

    for (const t of tables) {
      const total = t.liveTuples + t.deadTuples;
      if (total <= 0) continue;

      const deadRatio = t.deadTuples / total;
      if (deadRatio >= this.deadTupleRatioThreshold) {
        scheduled.push({
          tableName: t.tableName,
          deadRatio: Number(deadRatio.toFixed(3)),
          recommendedDdl: `VACUUM (ANALYZE) ${t.tableName};`
        });
      }
    }

    return scheduled.sort((a, b) => b.deadRatio - a.deadRatio);
  }
}
