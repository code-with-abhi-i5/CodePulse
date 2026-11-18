import { Test, TestingModule } from '@nestjs/testing';
import {
  ResourceReaperService,
  CloudResource,
  ICloudSdkProvider,
} from './resource-reaper.service';

describe('ResourceReaperService', () => {
  let service: ResourceReaperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResourceReaperService],
    }).compile();

    service = module.get<ResourceReaperService>(ResourceReaperService);
  });

  it('should identify off-peak hours correctly (00:00 to 06:00 UTC)', () => {
    // 03:00 UTC is off-peak
    const offPeakTime = new Date('2026-11-17T03:00:00Z');
    expect(service.isOffPeakHours(offPeakTime)).toBe(true);

    // 14:00 UTC is peak hours
    const peakTime = new Date('2026-11-17T14:00:00Z');
    expect(service.isOffPeakHours(peakTime)).toBe(false);
  });

  it('should protect production infrastructure and resources with protection tags from termination', () => {
    const prodResource: CloudResource = {
      id: 'vol-prod-1',
      name: 'codepulse-primary-storage',
      type: 'UNATTACHED_EBS_VOLUME',
      platform: 'AWS',
      environment: 'production',
      monthlyCostUsd: 500,
      idleDurationHours: 10,
      status: 'PROTECTED',
      tags: { env: 'production' },
      createdAt: '2026-11-01T00:00:00Z',
    };

    const taggedResource: CloudResource = {
      id: 'db-staging-1',
      name: 'critical-staging-db',
      type: 'IDLE_STAGING_DATABASE',
      platform: 'AWS',
      environment: 'staging',
      monthlyCostUsd: 200,
      idleDurationHours: 5,
      connectionsCount: 0,
      status: 'IDLE',
      tags: { protection: 'enabled' },
      createdAt: '2026-11-01T00:00:00Z',
    };

    expect(service.isProtectedResource(prodResource)).toBe(true);
    expect(service.shouldReapResource(prodResource)).toBe(false);

    expect(service.isProtectedResource(taggedResource)).toBe(true);
    expect(service.shouldReapResource(taggedResource)).toBe(false);
  });

  it('should detect unattached EBS volumes idle for >= 1 hour as reap candidates', () => {
    const idleVolume: CloudResource = {
      id: 'vol-idle-1',
      name: 'staging-test-volume',
      type: 'UNATTACHED_EBS_VOLUME',
      platform: 'AWS',
      environment: 'staging',
      monthlyCostUsd: 50,
      idleDurationHours: 1.5,
      status: 'IDLE',
      tags: {},
      createdAt: '2026-11-17T00:00:00Z',
    };

    expect(service.shouldReapResource(idleVolume)).toBe(true);
  });

  it('should detect staging databases with 0 connections for > 2 hours as reap candidates', () => {
    const idleDb: CloudResource = {
      id: 'db-idle-1',
      name: 'staging-qa-database',
      type: 'IDLE_STAGING_DATABASE',
      platform: 'GCP',
      environment: 'staging',
      monthlyCostUsd: 120,
      idleDurationHours: 2.5,
      connectionsCount: 0,
      status: 'IDLE',
      tags: {},
      createdAt: '2026-11-17T00:00:00Z',
    };

    expect(service.shouldReapResource(idleDb)).toBe(true);

    // If connections > 0, it should not be reaped
    const activeDb = { ...idleDb, connectionsCount: 3 };
    expect(service.shouldReapResource(activeDb)).toBe(false);
  });

  it('should detect orphan preview environments idle for > 4 hours as reap candidates', () => {
    const orphanPreview: CloudResource = {
      id: 'prev-123',
      name: 'preview-pr-123',
      type: 'ORPHAN_PREVIEW_ENVIRONMENT',
      platform: 'GCP',
      environment: 'preview',
      monthlyCostUsd: 70,
      idleDurationHours: 5.0,
      status: 'IDLE',
      tags: {},
      createdAt: '2026-11-17T00:00:00Z',
    };

    expect(service.shouldReapResource(orphanPreview)).toBe(true);
  });

  it('should terminate idle resources and scale non-production node pools to 0 during off-peak hours', async () => {
    const terminateSpy = jest.fn().mockResolvedValue(true);
    const scaleSpy = jest.fn().mockResolvedValue(true);

    const mockSdk: ICloudSdkProvider = {
      discoverResources: jest.fn().mockResolvedValue([
        // Prod resource: Whitelisted/protected
        {
          id: 'vol-prod',
          name: 'prod-main-volume',
          type: 'UNATTACHED_EBS_VOLUME',
          platform: 'AWS',
          environment: 'production',
          monthlyCostUsd: 200,
          idleDurationHours: 5,
          status: 'PROTECTED',
          tags: {},
          createdAt: '2026-11-01T00:00:00Z',
        },
        // Idle staging DB: should be reaped
        {
          id: 'db-staging-reap',
          name: 'staging-unused-db',
          type: 'IDLE_STAGING_DATABASE',
          platform: 'AWS',
          environment: 'staging',
          monthlyCostUsd: 150,
          idleDurationHours: 3,
          connectionsCount: 0,
          status: 'IDLE',
          tags: {},
          createdAt: '2026-11-01T00:00:00Z',
        },
        // Staging K8s Node Pool: should scale to 0 during off-peak
        {
          id: 'np-staging',
          name: 'staging-k8s-workers',
          type: 'IDLE_K8S_NODE_POOL',
          platform: 'DIGITALOCEAN',
          environment: 'staging',
          monthlyCostUsd: 180,
          idleDurationHours: 2,
          status: 'ACTIVE',
          tags: {},
          createdAt: '2026-11-01T00:00:00Z',
        },
      ]),
      terminateResource: terminateSpy,
      scaleNodePool: scaleSpy,
    };

    service.setCloudSdk(mockSdk);

    // Simulate 02:00 AM UTC (Off-peak)
    const offPeakTime = new Date('2026-11-17T02:00:00Z');
    const result = await service.runReaperScan(offPeakTime);

    expect(result.resourcesScannedCount).toBe(3);
    expect(result.protectedResourcesCount).toBe(1);
    expect(result.reapedResourcesCount).toBe(2);
    expect(result.offPeakScalingApplied).toBe(true);

    // Verify calls
    expect(terminateSpy).toHaveBeenCalledWith('db-staging-reap');
    expect(terminateSpy).not.toHaveBeenCalledWith('vol-prod');
    expect(scaleSpy).toHaveBeenCalledWith('np-staging', 0);
    expect(result.monthlySavingsUsd).toBeGreaterThan(0);
    expect(result.estimatedCarbonSavedKg).toBeGreaterThan(0);
  });

  it('should deliver FinOps dashboard metrics with platform and resource breakdowns', async () => {
    const metrics = await service.getFinOpsDashboardMetrics();
    expect(metrics.totalMonthlySpendUsd).toBeGreaterThan(0);
    expect(metrics.breakdownByPlatform.AWS).toBeDefined();
    expect(metrics.breakdownByPlatform.GCP).toBeDefined();
    expect(metrics.breakdownByPlatform.DIGITALOCEAN).toBeDefined();
    expect(metrics.carbonFootprintSavedKg).toBeDefined();
    expect(metrics.offPeakScalingStatus.enabled).toBe(true);
  });
});
