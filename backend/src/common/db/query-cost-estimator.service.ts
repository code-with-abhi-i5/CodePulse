import { QueryCostPlan } from '../../types/db';

export class QueryCostEstimatorService {
  constructor(
    private readonly maxAllowedTotalCost: number = 5000,
    private readonly sequentialScanThresholdRows: number = 10000
  ) {}

  public parseExplainPlan(explainJson: any): QueryCostPlan {
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
    let rejectionReason: string | undefined;

    if (totalCost > this.maxAllowedTotalCost) {
      isRejected = true;
      rejectionReason = `Query estimated total cost ${totalCost} exceeds limit ${this.maxAllowedTotalCost}`;
    } else if (hasSequentialScan && planRows >= this.sequentialScanThresholdRows) {
      isRejected = true;
      rejectionReason = `Unindexed sequential scan on table '${relationName || 'unknown'}' across ${planRows} estimated rows`;
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
