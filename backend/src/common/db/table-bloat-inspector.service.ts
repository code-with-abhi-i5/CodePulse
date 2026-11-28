import { TableBloatReport } from '../../types/db';

export class TableBloatInspectorService {
  constructor(
    private readonly emergencyThresholdRatio: number = 0.30,
    private readonly elevatedThresholdRatio: number = 0.15
  ) {}

  public inspectTableBloat(
    tableName: string,
    liveTuples: number,
    deadTuples: number
  ): TableBloatReport {
    const totalTuples = liveTuples + deadTuples;
    const deadTupleRatio = totalTuples > 0
      ? Number((deadTuples / totalTuples).toFixed(4))
      : 0;

    let urgency: 'EMERGENCY' | 'ELEVATED' | 'HEALTHY' = 'HEALTHY';
    if (deadTupleRatio >= this.emergencyThresholdRatio) {
      urgency = 'EMERGENCY';
    } else if (deadTupleRatio >= this.elevatedThresholdRatio) {
      urgency = 'ELEVATED';
    }

    const recommendedVacuumSql = urgency === 'EMERGENCY'
      ? `VACUUM FULL ANALYZE "${tableName}";`
      : `VACUUM ANALYZE "${tableName}";`;

    return {
      tableName,
      liveTuples,
      deadTuples,
      deadTupleRatio,
      urgency,
      recommendedVacuumSql
    };
  }
}
