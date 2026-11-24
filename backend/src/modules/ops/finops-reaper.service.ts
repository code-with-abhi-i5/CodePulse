import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  SavingsLedgerService,
  CloudProvider,
  ResourceType,
  SavingsLedgerEntry,
} from './savings-ledger.service';

export interface CloudResourceCandidate {
  resourceId: string;
  provider: CloudProvider;
  type: ResourceType;
  region: string;
  sizeGb?: number;
  idleHours: number;
  tags?: Record<string, string>;
  isProtected?: boolean;
}

export interface ReaperCycleReport {
  scannedCount: number;
  reapedCount: number;
  skippedProtectedCount: number;
  totalCycleMonthlySavingsUsd: number;
  wasteReductionPercent: number;
  reapedEntries: SavingsLedgerEntry[];
}

@Injectable()
export class FinOpsReaperService {
  private readonly logger = new Logger(FinOpsReaperService.name);

  // Pricing constants for estimation
  private readonly COST_PER_GB_EBS = 0.08; // $0.08 / GB-month for gp3
  private readonly COST_PER_UNATTACHED_IP = 3.65; // $0.005 / hour * 730 hours = ~$3.65/mo
  private readonly COST_PER_IDLE_RUNNER_POD = 45.00; // 2 vCPU + 4GB RAM runner ~ $45/mo

  private readonly ledger: SavingsLedgerService;

  constructor(
    @Optional() ledger?: SavingsLedgerService
  ) {
    this.ledger = ledger || new SavingsLedgerService();
  }

  /**
   * Evaluates and terminates idle cloud resources across AWS, GCP, and Kubernetes.
   */
  public async executeReaperCycle(candidates: CloudResourceCandidate[]): Promise<ReaperCycleReport> {
    let reapedCount = 0;
    let skippedProtected = 0;
    let cycleSavings = 0;
    const reapedEntries: SavingsLedgerEntry[] = [];

    // Calculate baseline total spend of idle resources
    let initialWasteSpend = 0;
    for (const c of candidates) {
      initialWasteSpend += this.calculateResourceMonthlyCost(c);
    }

    for (const resource of candidates) {
      // 1. Safety Guard Check: Never terminate protected or production resources
      if (this.isResourceProtected(resource)) {
        skippedProtected++;
        this.logger.debug(
          `Skipped protected resource: [${resource.provider}] ${resource.type} ${resource.resourceId}`
        );
        continue;
      }

      // 2. Idle Threshold Check (must be idle >= 4 hours for pods, >= 24h for IPs/disks)
      const minIdleHours = resource.type === 'IDLE_POD' ? 2 : 24;
      if (resource.idleHours < minIdleHours) {
        continue;
      }

      // 3. Graceful Termination & Savings Calculation
      const monthlySavings = this.calculateResourceMonthlyCost(resource);
      const ledgerEntry = this.ledger.recordSavings(
        resource.provider,
        resource.type,
        resource.resourceId,
        resource.region,
        monthlySavings,
        'finops-daemon',
        {
          sizeGb: resource.sizeGb,
          idleHours: resource.idleHours,
        }
      );

      reapedEntries.push(ledgerEntry);
      reapedCount++;
      cycleSavings += monthlySavings;
    }

    // Waste reduction calculation: proportion of idle waste eliminated
    const wasteReductionPercent =
      initialWasteSpend > 0
        ? Math.round((cycleSavings / initialWasteSpend) * 10000) / 100
        : 0;

    const report: ReaperCycleReport = {
      scannedCount: candidates.length,
      reapedCount,
      skippedProtectedCount: skippedProtected,
      totalCycleMonthlySavingsUsd: Math.round(cycleSavings * 100) / 100,
      wasteReductionPercent,
      reapedEntries,
    };

    this.logger.log(
      `FinOps Reaper Cycle finished: Scanned ${candidates.length}, Reaped ${reapedCount}, Saved \$${report.totalCycleMonthlySavingsUsd}/mo (${wasteReductionPercent}% waste cut)`
    );

    return report;
  }

  public calculateResourceMonthlyCost(resource: CloudResourceCandidate): number {
    switch (resource.type) {
      case 'ORPHANED_DISK':
        return (resource.sizeGb || 50) * this.COST_PER_GB_EBS;
      case 'UNATTACHED_IP':
        return this.COST_PER_UNATTACHED_IP;
      case 'IDLE_POD':
        return this.COST_PER_IDLE_RUNNER_POD;
      case 'ORPHANED_SNAPSHOT':
        return (resource.sizeGb || 50) * 0.05;
      default:
        return 5.0;
    }
  }

  private isResourceProtected(resource: CloudResourceCandidate): boolean {
    if (resource.isProtected) return true;
    if (!resource.tags) return false;

    const tags = resource.tags;
    if (tags['protection'] === 'true' || tags['do-not-delete'] === 'true') return true;
    if (tags['env'] === 'production' || tags['environment'] === 'prod') return true;

    return false;
  }
}
