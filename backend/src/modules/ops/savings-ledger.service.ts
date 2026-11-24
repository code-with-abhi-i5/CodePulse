import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type CloudProvider = 'AWS' | 'GCP' | 'AZURE';
export type ResourceType = 'ORPHANED_DISK' | 'UNATTACHED_IP' | 'IDLE_POD' | 'ORPHANED_SNAPSHOT';

export interface SavingsLedgerEntry {
  entryId: string;
  cloudProvider: CloudProvider;
  resourceType: ResourceType;
  resourceId: string;
  region: string;
  estimatedMonthlySavingsUsd: number;
  reapedAt: number;
  attributionTag: string;
  metadata?: Record<string, any>;
}

export interface SavingsSummary {
  totalMonthlySavingsUsd: number;
  totalResourcesReaped: number;
  savingsByProvider: Record<CloudProvider, number>;
  savingsByResourceType: Record<ResourceType, number>;
}

@Injectable()
export class SavingsLedgerService {
  private readonly logger = new Logger(SavingsLedgerService.name);

  private readonly entries: SavingsLedgerEntry[] = [];

  /**
   * Records an audited savings entry into the financial attribution ledger.
   */
  public recordSavings(
    cloudProvider: CloudProvider,
    resourceType: ResourceType,
    resourceId: string,
    region: string,
    estimatedMonthlySavingsUsd: number,
    attributionTag = 'automated-finops-reaper',
    metadata?: Record<string, any>
  ): SavingsLedgerEntry {
    const entry: SavingsLedgerEntry = {
      entryId: randomUUID(),
      cloudProvider,
      resourceType,
      resourceId,
      region,
      estimatedMonthlySavingsUsd: Math.round(estimatedMonthlySavingsUsd * 100) / 100,
      reapedAt: Date.now(),
      attributionTag,
      metadata,
    };

    this.entries.push(entry);
    this.logger.log(
      `FinOps Savings Recorded: [${cloudProvider}] ${resourceType} ${resourceId} in ${region} -> \$${entry.estimatedMonthlySavingsUsd}/mo`
    );

    return entry;
  }

  public getSummary(): SavingsSummary {
    let totalMonthlySavings = 0;
    const byProvider: Record<CloudProvider, number> = { AWS: 0, GCP: 0, AZURE: 0 };
    const byType: Record<ResourceType, number> = {
      ORPHANED_DISK: 0,
      UNATTACHED_IP: 0,
      IDLE_POD: 0,
      ORPHANED_SNAPSHOT: 0,
    };

    for (const e of this.entries) {
      totalMonthlySavings += e.estimatedMonthlySavingsUsd;
      byProvider[e.cloudProvider] = (byProvider[e.cloudProvider] || 0) + e.estimatedMonthlySavingsUsd;
      byType[e.resourceType] = (byType[e.resourceType] || 0) + e.estimatedMonthlySavingsUsd;
    }

    return {
      totalMonthlySavingsUsd: Math.round(totalMonthlySavings * 100) / 100,
      totalResourcesReaped: this.entries.length,
      savingsByProvider: byProvider,
      savingsByResourceType: byType,
    };
  }

  public getEntries(limit = 100): SavingsLedgerEntry[] {
    return this.entries.slice(-limit);
  }

  public clear(): void {
    this.entries.length = 0;
  }
}
