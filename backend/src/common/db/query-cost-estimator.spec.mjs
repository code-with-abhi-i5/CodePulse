import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class QueryCostEstimatorService {
  constructor(maxAllowedTotalCost = 5000, sequentialScanThresholdRows = 10000) {
    this.maxAllowedTotalCost = maxAllowedTotalCost;
    this.sequentialScanThresholdRows = sequentialScanThresholdRows;
  }

  parseExplainPlan(explainJson) {
    const planNode = Array.isArray(explainJson) && explainJson[0]?.Plan
      ? explainJson[0].Plan
      : explainJson?.Plan || explainJson;

    const totalCost = Number(planNode?.['Total Cost'] || 0);
    const startupCost = Number(planNode?.['Startup Cost'] || 0);
    const planRows = Number(planNode?.['Plan Rows'] || 0);
    const planWidth = Number(planNode?.['Plan Width'] || 0);
    const nodeType = String(planNode?.['Node Type'] || '');
    const relationName = planNode?.['Relation Name'] || undefined;

    const hasSequentialScan = nodeType.toLowerCase().includes('seq scan');

    let isRejected = false;
    let rejectionReason = undefined;

    if (totalCost > this.maxAllowedTotalCost) {
      isRejected = true;
      rejectionReason = 'Query estimated total cost ' + totalCost + ' exceeds limit ' + this.maxAllowedTotalCost;
    } else if (hasSequentialScan && planRows >= this.sequentialScanThresholdRows) {
      isRejected = true;
      rejectionReason = 'Unindexed sequential scan on table \'' + (relationName || 'unknown') + '\' across ' + planRows + ' estimated rows';
    }

    return {
      totalCost,
      startupCost,
      planRows,
      planWidth,
      hasSequentialScan,
      scannedTable: relationName,
      isRejected,
      rejectionReason
    };
  }
}

describe('QueryCostEstimatorService', () => {
  const estimator = new QueryCostEstimatorService(5000, 10000);

  it('approves lightweight index scan queries', () => {
    const plan = [{
      Plan: {
        'Node Type': 'Index Scan',
        'Startup Cost': 0.28,
        'Total Cost': 8.30,
        'Plan Rows': 1,
        'Plan Width': 32,
        'Relation Name': 'users'
      }
    }];

    const result = estimator.parseExplainPlan(plan);
    assert.equal(result.isRejected, false);
    assert.equal(result.hasSequentialScan, false);
    assert.equal(result.totalCost, 8.30);
  });

  it('rejects massive unindexed sequential scans', () => {
    const plan = [{
      Plan: {
        'Node Type': 'Seq Scan',
        'Startup Cost': 0.00,
        'Total Cost': 4500.00,
        'Plan Rows': 50000,
        'Plan Width': 120,
        'Relation Name': 'match_logs'
      }
    }];

    const result = estimator.parseExplainPlan(plan);
    assert.equal(result.isRejected, true);
    assert.equal(result.hasSequentialScan, true);
    assert.ok(result.rejectionReason.includes('Unindexed sequential scan'));
  });

  it('rejects queries with total cost exceeding upper threshold', () => {
    const plan = {
      Plan: {
        'Node Type': 'Nested Loop',
        'Startup Cost': 100.00,
        'Total Cost': 12000.00,
        'Plan Rows': 500,
        'Plan Width': 64
      }
    };

    const result = estimator.parseExplainPlan(plan);
    assert.equal(result.isRejected, true);
    assert.ok(result.rejectionReason.includes('exceeds limit 5000'));
  });
});
