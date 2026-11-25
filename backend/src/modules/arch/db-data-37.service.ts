/**
 * Architecture Service: Database Query Cost Governor
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-37]
 */

export interface QueryPlanSummary {
  nodeType: string;
  totalCost: number;
  estimatedRows: number;
  tableName?: string;
}

export class DatabaseQueryCostGovernorService {
  private maxAllowedCost: number;
  private minRowsForSeqScanGuard: number;
  private isProduction: boolean;

  constructor(maxAllowedCost: number = 5000, minRowsForSeqScanGuard: number = 10000, isProduction: boolean = true) {
    this.maxAllowedCost = maxAllowedCost;
    this.minRowsForSeqScanGuard = minRowsForSeqScanGuard;
    this.isProduction = isProduction;
  }

  public evaluateQueryPlan(plan: QueryPlanSummary): {
    allowed: boolean;
    reason?: string;
  } {
    if (!this.isProduction) {
      return { allowed: true };
    }

    if (plan.nodeType === 'Seq Scan' && plan.estimatedRows >= this.minRowsForSeqScanGuard) {
      return {
        allowed: false,
        reason: `Query cost governor rejected unindexed full-table scan on '${plan.tableName || 'table'}' (estimated rows: ${plan.estimatedRows})`
      };
    }

    if (plan.totalCost > this.maxAllowedCost) {
      return {
        allowed: false,
        reason: `Query estimated cost ${plan.totalCost} exceeds maximum allowed budget ${this.maxAllowedCost}`
      };
    }

    return { allowed: true };
  }
}
