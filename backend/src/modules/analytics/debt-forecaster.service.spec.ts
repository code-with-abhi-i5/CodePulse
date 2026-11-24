import { Test, TestingModule } from '@nestjs/testing';
import {
  DebtForecasterService,
  TechDebtForecastResult,
} from './debt-forecaster.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DebtForecasterService', () => {
  let service: DebtForecasterService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      repository: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'repo-test-123',
          name: 'code-pulse-core',
          fullName: 'code-with-abhi-i5/code-pulse-core',
          complexities: [
            {
              totalLoc: 50000,
              averageMaintainability: 72.0,
              highRiskFunctionsCount: 5,
            },
          ],
        }),
      },
      technicalDebtForecast: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'forecast-1', ...data }),
        ),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtForecasterService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<DebtForecasterService>(DebtForecasterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('SQALE Standard Rating Evaluation', () => {
    it('should assign accurate SQALE ratings based on Technical Debt Ratio (TDR)', () => {
      expect(service.getSqaleRating(3.2)).toBe('A');
      expect(service.getSqaleRating(5.0)).toBe('A');
      expect(service.getSqaleRating(7.5)).toBe('B');
      expect(service.getSqaleRating(10.0)).toBe('B');
      expect(service.getSqaleRating(14.2)).toBe('C');
      expect(service.getSqaleRating(20.0)).toBe('C');
      expect(service.getSqaleRating(35.0)).toBe('D');
      expect(service.getSqaleRating(50.0)).toBe('D');
      expect(service.getSqaleRating(55.0)).toBe('E');
    });
  });

  describe('Time-Series Linear Regression Model', () => {
    it('should calculate slope, intercept, and R2 accurately for linear series', () => {
      // y = 2x + 1
      const x = [0, 1, 2, 3, 4];
      const y = [1, 3, 5, 7, 9];

      const reg = service.calculateLinearRegression(x, y);

      expect(reg.slope).toBeCloseTo(2.0, 3);
      expect(reg.intercept).toBeCloseTo(1.0, 3);
      expect(reg.r2).toBeCloseTo(1.0, 3);
    });

    it('should handle edge cases with zero or mismatched lengths gracefully', () => {
      expect(service.calculateLinearRegression([], [])).toEqual({ slope: 0, intercept: 0, r2: 0 });
      expect(service.calculateLinearRegression([1, 2], [1])).toEqual({ slope: 0, intercept: 0, r2: 0 });
    });
  });

  describe('Ticking Time Bombs Detection (Complexity vs Test Coverage Divergence)', () => {
    it('should detect modules where code complexity is growing 3x faster than test coverage', () => {
      const bombs = service.detectTickingTimeBombs();

      expect(bombs.length).toBeGreaterThan(0);
      for (const b of bombs) {
        expect(b.divergenceRatio).toBeGreaterThanOrEqual(3.0);
        expect(['CRITICAL', 'HIGH', 'MODERATE']).toContain(b.riskLevel);
        expect(b.daysToMaintainabilityCollapse).toBeGreaterThan(0);
        expect(b.recommendedRefactoring).toBeDefined();
      }

      // Check specific critical bomb
      const syncBomb = bombs.find((b) => b.filePath.includes('sync.cron.ts'));
      expect(syncBomb).toBeDefined();
      expect(syncBomb?.cyclomaticComplexity).toBeGreaterThanOrEqual(30);
      expect(syncBomb?.divergenceRatio).toBeGreaterThanOrEqual(5.0);
      expect(syncBomb?.riskLevel).toBe('CRITICAL');
    });
  });

  describe('Actionable Maintenance Roadmap Generation with ROI', () => {
    it('should synthesize maintenance roadmap items with quantified engineering hours saved', () => {
      const bombs = service.detectTickingTimeBombs();
      const roadmap = service.generateMaintenanceRoadmap(bombs, 3000);

      expect(roadmap.length).toBeGreaterThan(0);

      let totalSaved = 0;
      for (const item of roadmap) {
        expect(['P0', 'P1', 'P2']).toContain(item.priority);
        expect(item.estimatedRemediationHours).toBeGreaterThan(0);
        expect(item.estimatedHoursSavedPerYear).toBeGreaterThan(item.estimatedRemediationHours);
        expect(item.roiMultiplier).toBeGreaterThan(1.0);
        totalSaved += item.estimatedHoursSavedPerYear;
      }

      expect(totalSaved).toBeGreaterThan(200);
    });
  });

  describe('End-to-End Technical Debt Forecast Engine', () => {
    it('should forecast technical debt 6 months into future with timeline and SQALE metrics', async () => {
      const forecast: TechDebtForecastResult = await service.getTechDebtForecast('repo-test-123');

      expect(forecast.repositoryId).toBe('repo-test-123');
      expect(forecast.repositoryName).toContain('code-pulse-core');

      // 12 historical months + 6 forecast months = 18 data points
      expect(forecast.forecastTimeline.length).toBe(18);

      const historical = forecast.forecastTimeline.filter((p) => !p.isForecast);
      const future = forecast.forecastTimeline.filter((p) => p.isForecast);

      expect(historical.length).toBe(12);
      expect(future.length).toBe(6);

      // Verify future confidence intervals
      for (const f of future) {
        expect(f.confidenceHigh).toBeGreaterThanOrEqual(f.tdrPercentage);
        expect(f.confidenceLow).toBeLessThanOrEqual(f.tdrPercentage);
      }

      // Verify metrics summary
      expect(forecast.metrics.developmentCostHours).toBe(3000); // 50,000 LOC * 0.06
      expect(forecast.metrics.currentDebtHours).toBeGreaterThan(0);
      expect(forecast.metrics.projectedTdr6Months).toBeGreaterThan(0);
      expect(forecast.metrics.regressionR2).toBeGreaterThanOrEqual(0);
      expect(forecast.metrics.netHoursSavedByRoadmap).toBeGreaterThan(100);

      // Verify Prisma save was called
      expect(prismaMock.technicalDebtForecast.create).toHaveBeenCalled();
    });

    it('should return cached forecast on successive calls', async () => {
      const res1 = await service.getTechDebtForecast('repo-cached');
      const res2 = await service.getTechDebtForecast('repo-cached');

      expect(res1).toBe(res2);
    });
  });
});

