import { Test, TestingModule } from '@nestjs/testing';
import { CloudCostController } from './cloud-cost.controller';
import { ResourceReaperService } from './resource-reaper.service';

/* eslint-disable @typescript-eslint/unbound-method */

describe('CloudCostController', () => {
  let controller: CloudCostController;
  let reaperService: jest.Mocked<ResourceReaperService>;

  beforeEach(async () => {
    reaperService = {
      getFinOpsDashboardMetrics: jest.fn().mockResolvedValue({
        totalMonthlySpendUsd: 1200,
        totalMonthlySavingsUsd: 450,
        carbonFootprintSavedKg: 189,
        activeResourcesCount: 15,
        reapedResourcesHistoryCount: 4,
        offPeakScalingStatus: {
          enabled: true,
          isOffPeakNow: false,
          currentHourUtc: 14,
          stagingReplicaTarget: 3,
        },
      }),
      runReaperScan: jest.fn().mockResolvedValue({
        scannedAt: '2026-11-17T00:00:00Z',
        resourcesScannedCount: 10,
        reapedResourcesCount: 3,
        protectedResourcesCount: 2,
        monthlySavingsUsd: 280,
        estimatedCarbonSavedKg: 118,
        offPeakScalingApplied: false,
        reapedItems: [],
      }),
      setOffPeakEnabled: jest.fn(),
    } as unknown as jest.Mocked<ResourceReaperService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CloudCostController],
      providers: [{ provide: ResourceReaperService, useValue: reaperService }],
    }).compile();

    controller = module.get<CloudCostController>(CloudCostController);
  });

  it('should return FinOps dashboard metrics on GET /admin/cloud-costs', async () => {
    const metrics = await controller.getCloudCostMetrics();
    expect(reaperService.getFinOpsDashboardMetrics).toHaveBeenCalled();
    expect(metrics.totalMonthlySpendUsd).toBe(1200);
    expect(metrics.totalMonthlySavingsUsd).toBe(450);
  });

  it('should trigger manual reaper scan on POST /admin/cloud-costs/reap', async () => {
    const summary = await controller.triggerReaperScan();
    expect(reaperService.runReaperScan).toHaveBeenCalled();
    expect(summary.reapedResourcesCount).toBe(3);
    expect(summary.monthlySavingsUsd).toBe(280);
  });

  it('should configure off-peak scaling on POST /admin/cloud-costs/off-peak', () => {
    const res = controller.setOffPeakConfig(true);
    expect(reaperService.setOffPeakEnabled).toHaveBeenCalledWith(true);
    expect(res.enabled).toBe(true);
  });
});
