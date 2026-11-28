import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class TableBloatInspectorService {
  constructor(emergencyThresholdRatio = 0.30, elevatedThresholdRatio = 0.15) {
    this.emergencyThresholdRatio = emergencyThresholdRatio;
    this.elevatedThresholdRatio = elevatedThresholdRatio;
  }

  inspectTableBloat(tableName, liveTuples, deadTuples) {
    const totalTuples = liveTuples + deadTuples;
    const deadTupleRatio = totalTuples > 0
      ? Number((deadTuples / totalTuples).toFixed(4))
      : 0;

    let urgency = 'HEALTHY';
    if (deadTupleRatio >= this.emergencyThresholdRatio) {
      urgency = 'EMERGENCY';
    } else if (deadTupleRatio >= this.elevatedThresholdRatio) {
      urgency = 'ELEVATED';
    }

    const recommendedVacuumSql = urgency === 'EMERGENCY'
      ? 'VACUUM FULL ANALYZE "' + tableName + '";'
      : 'VACUUM ANALYZE "' + tableName + '";';

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

describe('TableBloatInspectorService', () => {
  const inspector = new TableBloatInspectorService(0.30, 0.15);

  it('classifies healthy tables with low dead tuple ratios', () => {
    const report = inspector.inspectTableBloat('users', 9500, 500);
    assert.equal(report.urgency, 'HEALTHY');
    assert.equal(report.recommendedVacuumSql, 'VACUUM ANALYZE "users";');
    assert.equal(report.deadTupleRatio, 0.05);
  });

  it('classifies elevated tables needing standard vacuum', () => {
    const report = inspector.inspectTableBloat('submissions', 8000, 2000);
    assert.equal(report.urgency, 'ELEVATED');
    assert.equal(report.recommendedVacuumSql, 'VACUUM ANALYZE "submissions";');
    assert.equal(report.deadTupleRatio, 0.2);
  });

  it('classifies emergency bloated tables requiring VACUUM FULL ANALYZE', () => {
    const report = inspector.inspectTableBloat('battle_logs', 5000, 5000);
    assert.equal(report.urgency, 'EMERGENCY');
    assert.equal(report.recommendedVacuumSql, 'VACUUM FULL ANALYZE "battle_logs";');
    assert.equal(report.deadTupleRatio, 0.5);
  });

  it('handles empty tables cleanly without division by zero', () => {
    const report = inspector.inspectTableBloat('empty_table', 0, 0);
    assert.equal(report.urgency, 'HEALTHY');
    assert.equal(report.deadTupleRatio, 0);
  });
});
