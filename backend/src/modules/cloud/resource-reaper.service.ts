import { Injectable, Logger } from '@nestjs/common';

export type CloudPlatform = 'AWS' | 'GCP' | 'DIGITALOCEAN';
export type ResourceType =
  | 'UNATTACHED_EBS_VOLUME'
  | 'IDLE_STAGING_DATABASE'
  | 'ORPHAN_PREVIEW_ENVIRONMENT'
  | 'IDLE_K8S_NODE_POOL';

export interface CloudResource {
  id: string;
  name: string;
  type: ResourceType;
  platform: CloudPlatform;
  environment: 'production' | 'staging' | 'preview' | 'development';
  monthlyCostUsd: number;
  idleDurationHours: number;
  connectionsCount?: number;
  status: 'ACTIVE' | 'IDLE' | 'TERMINATED' | 'SCALED_TO_ZERO' | 'PROTECTED';
  tags: Record<string, string>;
  createdAt: string;
}

export interface ReaperScanSummary {
  scannedAt: string;
  resourcesScannedCount: number;
  reapedResourcesCount: number;
  protectedResourcesCount: number;
  monthlySavingsUsd: number;
  estimatedCarbonSavedKg: number;
  offPeakScalingApplied: boolean;
  reapedItems: {
    id: string;
    name: string;
    type: ResourceType;
    platform: CloudPlatform;
    action: string;
    savingsUsd: number;
  }[];
}

export interface FinOpsDashboardMetrics {
  totalMonthlySpendUsd: number;
  totalMonthlySavingsUsd: number;
  carbonFootprintSavedKg: number;
  activeResourcesCount: number;
  reapedResourcesHistoryCount: number;
  offPeakScalingStatus: {
    enabled: boolean;
    isOffPeakNow: boolean;
    currentHourUtc: number;
    stagingReplicaTarget: number;
  };
  breakdownByPlatform: Record<
    CloudPlatform,
    { spendUsd: number; savingsUsd: number; idleResourcesCount: number }
  >;
  breakdownByType: Record<
    ResourceType,
    { count: number; monthlySavingsUsd: number }
  >;
  recentReapActions: {
    id: string;
    resourceName: string;
    type: ResourceType;
    platform: CloudPlatform;
    action: string;
    savingsUsd: number;
    timestamp: string;
  }[];
}

export interface ICloudSdkProvider {
  discoverResources(): Promise<CloudResource[]>;
  terminateResource(resourceId: string): Promise<boolean>;
  scaleNodePool(poolId: string, replicas: number): Promise<boolean>;
}

@Injectable()
export class ResourceReaperService {
  private readonly logger = new Logger(ResourceReaperService.name);

  // Protected Whitelist: Production tags, namespaces, and explicit protect markers
  private readonly protectedKeywords = [
    'production',
    'prod',
    'main',
    'live',
    'critical',
    'do-not-delete',
  ];

  // In-memory records
  private readonly reapHistory: {
    id: string;
    resourceName: string;
    type: ResourceType;
    platform: CloudPlatform;
    action: string;
    savingsUsd: number;
    timestamp: string;
  }[] = [];

  private cloudSdk: ICloudSdkProvider;
  private offPeakEnabled = true;

  constructor() {
    this.cloudSdk = this.createDefaultMockCloudSdk();
  }

  setCloudSdk(sdk: ICloudSdkProvider): void {
    this.cloudSdk = sdk;
  }

  setOffPeakEnabled(enabled: boolean): void {
    this.offPeakEnabled = enabled;
  }

  /**
   * Checks whether the current time (UTC) is off-peak (midnight to 6:00 AM UTC).
   */
  isOffPeakHours(customDate?: Date): boolean {
    const d = customDate ?? new Date();
    const utcHour = d.getUTCHours();
    return utcHour >= 0 && utcHour < 6;
  }

  /**
   * Safety Whitelist Check:
   * Prevents accidental deletion of production infrastructure, live databases,
   * or resources marked with protection tags.
   */
  isProtectedResource(resource: CloudResource): boolean {
    // 1. Environment check
    if (resource.environment === 'production') {
      return true;
    }

    // 2. Name check
    const nameLower = resource.name.toLowerCase();
    for (const kw of this.protectedKeywords) {
      if (nameLower.includes(kw)) {
        return true;
      }
    }

    // 3. Tag checks
    for (const [key, val] of Object.entries(resource.tags)) {
      const keyLower = key.toLowerCase();
      const valLower = String(val).toLowerCase();

      if (keyLower === 'protection' && valLower === 'enabled') {
        return true;
      }
      if (keyLower === 'env' && valLower === 'production') {
        return true;
      }
      for (const kw of this.protectedKeywords) {
        if (valLower.includes(kw)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Evaluates if a resource meets reaper termination criteria:
   * 1. Unattached EBS volumes
   * 2. Staging databases with 0 connections for > 2 hours
   * 3. Orphan preview environments with inactivity > 4 hours
   */
  shouldReapResource(resource: CloudResource): boolean {
    if (this.isProtectedResource(resource)) {
      return false;
    }

    switch (resource.type) {
      case 'UNATTACHED_EBS_VOLUME':
        return resource.idleDurationHours >= 1;

      case 'IDLE_STAGING_DATABASE':
        return (
          resource.idleDurationHours >= 2 &&
          (resource.connectionsCount === undefined ||
            resource.connectionsCount === 0)
        );

      case 'ORPHAN_PREVIEW_ENVIRONMENT':
        return resource.idleDurationHours >= 4;

      default:
        return false;
    }
  }

  /**
   * Scans multi-cloud infrastructure (AWS, GCP, DigitalOcean):
   * - Identifies and terminates idle resources (unattached EBS, abandoned preview environments, idle staging DBs).
   * - Scales staging Kubernetes node pools to 0 replicas during off-peak hours (midnight to 6 AM UTC).
   */
  async runReaperScan(simulatedDate?: Date): Promise<ReaperScanSummary> {
    const scannedAt = new Date().toISOString();
    this.logger.log(
      'Starting automated multi-cloud cost optimization & resource reaper scan...',
    );

    const resources = await this.cloudSdk.discoverResources();
    const isOffPeak = this.isOffPeakHours(simulatedDate);

    let reapedCount = 0;
    let protectedCount = 0;
    let totalSavingsUsd = 0;
    const reapedItems: ReaperScanSummary['reapedItems'] = [];

    for (const resource of resources) {
      // Check protection
      if (this.isProtectedResource(resource)) {
        protectedCount++;
        continue;
      }

      // Check off-peak scaling for non-production Kubernetes node pools
      if (
        resource.type === 'IDLE_K8S_NODE_POOL' &&
        resource.environment !== 'production' &&
        this.offPeakEnabled &&
        isOffPeak
      ) {
        this.logger.log(
          `[Off-Peak] Scaling staging node pool "${resource.name}" to 0 replicas (cutting costs > 60%)`,
        );
        await this.cloudSdk.scaleNodePool(resource.id, 0);

        const savings = resource.monthlyCostUsd * 0.65; // ~65% savings during off-peak scaling
        totalSavingsUsd += savings;
        reapedCount++;

        const reapItem = {
          id: resource.id,
          name: resource.name,
          type: resource.type,
          platform: resource.platform,
          action: 'SCALED_TO_ZERO (Off-Peak Night Scale)',
          savingsUsd: Math.round(savings),
        };
        reapedItems.push(reapItem);

        this.recordReapAction({
          ...reapItem,
          resourceName: resource.name,
          timestamp: scannedAt,
        });
        continue;
      }

      // Check standard idle resource reaping
      if (this.shouldReapResource(resource)) {
        this.logger.warn(
          `[Reaper] Terminating idle ${resource.type} "${resource.name}" on ${resource.platform} (${resource.idleDurationHours}h idle, saving $${resource.monthlyCostUsd}/mo)`,
        );
        await this.cloudSdk.terminateResource(resource.id);

        totalSavingsUsd += resource.monthlyCostUsd;
        reapedCount++;

        const reapItem = {
          id: resource.id,
          name: resource.name,
          type: resource.type,
          platform: resource.platform,
          action: 'TERMINATED (Inactivity Reaper)',
          savingsUsd: resource.monthlyCostUsd,
        };
        reapedItems.push(reapItem);

        this.recordReapAction({
          ...reapItem,
          resourceName: resource.name,
          timestamp: scannedAt,
        });
      }
    }

    // Carbon calculation formula: ~0.42 kg CO2e per dollar of cloud computing saved
    const estimatedCarbonSavedKg = Math.round(totalSavingsUsd * 0.42);

    this.logger.log(
      `Reaper scan completed: Reaped ${reapedCount} resources, Protected ${protectedCount}. Monthly savings: $${totalSavingsUsd}, Carbon avoided: ${estimatedCarbonSavedKg} kg CO2e`,
    );

    return {
      scannedAt,
      resourcesScannedCount: resources.length,
      reapedResourcesCount: reapedCount,
      protectedResourcesCount: protectedCount,
      monthlySavingsUsd: Math.round(totalSavingsUsd),
      estimatedCarbonSavedKg,
      offPeakScalingApplied: isOffPeak && this.offPeakEnabled,
      reapedItems,
    };
  }

  /**
   * Generates administrative FinOps Dashboard metrics and reports.
   */
  async getFinOpsDashboardMetrics(
    simulatedDate?: Date,
  ): Promise<FinOpsDashboardMetrics> {
    const resources = await this.cloudSdk.discoverResources();
    const isOffPeak = this.isOffPeakHours(simulatedDate);
    const currentHourUtc = (simulatedDate ?? new Date()).getUTCHours();

    let totalSpend = 0;
    let totalSavings = 0;

    const breakdownByPlatform: FinOpsDashboardMetrics['breakdownByPlatform'] = {
      AWS: { spendUsd: 0, savingsUsd: 0, idleResourcesCount: 0 },
      GCP: { spendUsd: 0, savingsUsd: 0, idleResourcesCount: 0 },
      DIGITALOCEAN: { spendUsd: 0, savingsUsd: 0, idleResourcesCount: 0 },
    };

    const breakdownByType: FinOpsDashboardMetrics['breakdownByType'] = {
      UNATTACHED_EBS_VOLUME: { count: 0, monthlySavingsUsd: 0 },
      IDLE_STAGING_DATABASE: { count: 0, monthlySavingsUsd: 0 },
      ORPHAN_PREVIEW_ENVIRONMENT: { count: 0, monthlySavingsUsd: 0 },
      IDLE_K8S_NODE_POOL: { count: 0, monthlySavingsUsd: 0 },
    };

    for (const r of resources) {
      totalSpend += r.monthlyCostUsd;
      if (breakdownByPlatform[r.platform]) {
        breakdownByPlatform[r.platform].spendUsd += r.monthlyCostUsd;
      }

      if (this.shouldReapResource(r)) {
        totalSavings += r.monthlyCostUsd;
        if (breakdownByPlatform[r.platform]) {
          breakdownByPlatform[r.platform].savingsUsd += r.monthlyCostUsd;
          breakdownByPlatform[r.platform].idleResourcesCount++;
        }
        if (breakdownByType[r.type]) {
          breakdownByType[r.type].count++;
          breakdownByType[r.type].monthlySavingsUsd += r.monthlyCostUsd;
        }
      }
    }

    // Add historic savings from past reaper executions
    for (const h of this.reapHistory) {
      totalSavings += h.savingsUsd;
    }

    const carbonFootprintSavedKg = Math.round(totalSavings * 0.42);

    return {
      totalMonthlySpendUsd: Math.round(totalSpend),
      totalMonthlySavingsUsd: Math.round(totalSavings),
      carbonFootprintSavedKg,
      activeResourcesCount: resources.length,
      reapedResourcesHistoryCount: this.reapHistory.length,
      offPeakScalingStatus: {
        enabled: this.offPeakEnabled,
        isOffPeakNow: isOffPeak,
        currentHourUtc,
        stagingReplicaTarget: isOffPeak ? 0 : 3,
      },
      breakdownByPlatform,
      breakdownByType,
      recentReapActions: this.reapHistory.slice(-10).reverse(),
    };
  }

  private recordReapAction(item: {
    id: string;
    resourceName: string;
    type: ResourceType;
    platform: CloudPlatform;
    action: string;
    savingsUsd: number;
    timestamp: string;
  }): void {
    this.reapHistory.push(item);
  }

  /**
   * Default Cloud SDK client delivering realistic multi-cloud resources.
   */
  private createDefaultMockCloudSdk(): ICloudSdkProvider {
    return {
      discoverResources: (): Promise<CloudResource[]> => {
        const resources: CloudResource[] = [
          // Production protected
          {
            id: 'vol-prod-001',
            name: 'codepulse-prod-database-storage',
            type: 'UNATTACHED_EBS_VOLUME',
            platform: 'AWS',
            environment: 'production',
            monthlyCostUsd: 250,
            idleDurationHours: 5,
            status: 'PROTECTED',
            tags: { env: 'production', tier: 'critical' },
            createdAt: '2026-11-01T00:00:00Z',
          },
          // Staging idle DB (> 2h with 0 connections)
          {
            id: 'rds-staging-002',
            name: 'codepulse-staging-postgres-replica',
            type: 'IDLE_STAGING_DATABASE',
            platform: 'AWS',
            environment: 'staging',
            monthlyCostUsd: 140,
            idleDurationHours: 3.5,
            connectionsCount: 0,
            status: 'IDLE',
            tags: { env: 'staging', app: 'db' },
            createdAt: '2026-11-10T00:00:00Z',
          },
          // Orphan preview env (> 4h idle)
          {
            id: 'prev-pr-412',
            name: 'codepulse-preview-pr-412',
            type: 'ORPHAN_PREVIEW_ENVIRONMENT',
            platform: 'GCP',
            environment: 'preview',
            monthlyCostUsd: 85,
            idleDurationHours: 6.0,
            status: 'IDLE',
            tags: { env: 'preview', pr: '412' },
            createdAt: '2026-11-12T00:00:00Z',
          },
          // Unattached EBS volume (> 1h idle)
          {
            id: 'vol-unattached-003',
            name: 'unattached-scratch-volume-staging',
            type: 'UNATTACHED_EBS_VOLUME',
            platform: 'AWS',
            environment: 'staging',
            monthlyCostUsd: 45,
            idleDurationHours: 2.0,
            status: 'IDLE',
            tags: { env: 'staging' },
            createdAt: '2026-11-15T00:00:00Z',
          },
          // Staging K8s Node Pool (Off-peak scaling candidate)
          {
            id: 'np-staging-doks',
            name: 'staging-k8s-node-pool',
            type: 'IDLE_K8S_NODE_POOL',
            platform: 'DIGITALOCEAN',
            environment: 'staging',
            monthlyCostUsd: 180,
            idleDurationHours: 1.0,
            status: 'ACTIVE',
            tags: { env: 'staging', pool: 'general' },
            createdAt: '2026-11-01T00:00:00Z',
          },
        ];
        return Promise.resolve(resources);
      },
      terminateResource: (resourceId: string) => {
        this.logger.log(`[Cloud SDK Mock] Terminated resource: ${resourceId}`);
        return Promise.resolve(true);
      },
      scaleNodePool: (poolId: string, replicas: number) => {
        this.logger.log(
          `[Cloud SDK Mock] Scaled node pool "${poolId}" to ${replicas} replicas`,
        );
        return Promise.resolve(true);
      },
    };
  }
}
