import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GameDayRunnerService,
  GameDayScenario,
  DrillStatus,
} from './gameday-runner.service';

describe('GameDayRunnerService', () => {
  let service: GameDayRunnerService;
  let configService: Partial<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'staging';
        if (key === 'ALLOW_GAMEDAY_DRILLS') return undefined;
        return undefined;
      }),
    };

    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        GameDayRunnerService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([1]),
          },
        },
      ],
    }).compile();

    service = testingModule.get<GameDayRunnerService>(GameDayRunnerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service.TARGET_RTO_SECONDS).toBe(30);
    expect(service.TARGET_RPO_SECONDS).toBe(5);
  });

  describe('Environment Gating & Safety Checks', () => {
    it('should allow running drills in staging environment', () => {
      expect(service.isEnvironmentAllowed()).toBe(true);
      expect(service.getEnvironment()).toBe('staging');
    });

    it('should allow running drills in pre-production and development environments', () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'pre-production';
        return undefined;
      });
      expect(service.isEnvironmentAllowed()).toBe(true);

      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return undefined;
      });
      expect(service.isEnvironmentAllowed()).toBe(true);
    });

    it('should reject drill execution in production without force or ALLOW_GAMEDAY_DRILLS', async () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      });

      expect(service.isEnvironmentAllowed()).toBe(false);

      await expect(
        service.startDrill({ scenario: GameDayScenario.PRIMARY_DB_CRASH }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow drill in production when force flag is set', async () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      });

      const result = await service.startDrill({
        scenario: GameDayScenario.PRIMARY_DB_CRASH,
        force: true,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.drillId).toBeDefined();
    });

    it('should allow drill in production when ALLOW_GAMEDAY_DRILLS is true', async () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'ALLOW_GAMEDAY_DRILLS') return 'true';
        return undefined;
      });

      expect(service.isEnvironmentAllowed()).toBe(true);
      const result = await service.startDrill({ dryRun: true });
      expect(result.success).toBe(true);
    });
  });

  describe('Drill Scenarios & SLA Measurement', () => {
    it('should execute PRIMARY_DB_CRASH drill and verify RTO and RPO meet SLAs', async () => {
      const result = await service.startDrill({
        scenario: GameDayScenario.PRIMARY_DB_CRASH,
        mockRtoSeconds: 14.5,
        mockRpoSeconds: 1.2,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('PASSED');
      expect(result.scenario).toBe(GameDayScenario.PRIMARY_DB_CRASH);

      // Verify RTO SLA: Target < 30s, Actual 14.5s
      expect(result.rto.targetSeconds).toBe(30);
      expect(result.rto.actualSeconds).toBe(14.5);
      expect(result.rto.slaMet).toBe(true);

      // Verify RPO SLA: Target < 5s, Actual 1.2s
      expect(result.rpo.targetSeconds).toBe(5);
      expect(result.rpo.actualSeconds).toBe(1.2);
      expect(result.rpo.slaMet).toBe(true);

      // Verify Audit Report contents
      const report = result.report;
      expect(report.singlePointsOfFailure.length).toBeGreaterThan(0);
      expect(report.recoveryBottlenecks.length).toBeGreaterThan(0);
      expect(report.actionItems.length).toBeGreaterThan(0);
      expect(report.stepLogs.length).toBeGreaterThanOrEqual(4);
      expect(report.auditSignature).toBeDefined();
      expect(report.auditSignature.length).toBe(64); // SHA-256 hex
    });

    it('should flag breached RTO when recovery exceeds 30 seconds SLA', async () => {
      const result = await service.startDrill({
        scenario: GameDayScenario.PRIMARY_DB_CRASH,
        mockRtoSeconds: 38.2, // Exceeds 30s SLA
        mockRpoSeconds: 1.0,
        dryRun: true,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('WARNING');
      expect(result.rto.slaMet).toBe(false);
      expect(result.rpo.slaMet).toBe(true);

      const bottlenecks = result.report.recoveryBottlenecks.join(' ');
      expect(bottlenecks).toContain('breached SLA threshold');
    });

    it('should execute REDIS_CLUSTER_SPLIT scenario and verify sentinel quorum election', async () => {
      const result = await service.startDrill({
        scenario: GameDayScenario.REDIS_CLUSTER_SPLIT,
        mockRtoSeconds: 8.4,
        mockRpoSeconds: 0.5,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('PASSED');
      expect(result.scenario).toBe(GameDayScenario.REDIS_CLUSTER_SPLIT);
      expect(result.rto.slaMet).toBe(true);
      expect(result.rpo.slaMet).toBe(true);

      const steps = result.report.stepLogs.map((l) => l.step);
      expect(steps).toContain('SENTINEL_QUORUM_ELECTION');
      expect(steps).toContain('CLIENT_TOPOLOGY_REFRESH');
    });

    it('should execute NETWORK_BLACKHOLE scenario and verify multi-region failover and alert cascade', async () => {
      const result = await service.startDrill({
        scenario: GameDayScenario.NETWORK_BLACKHOLE,
        mockRtoSeconds: 22.1,
        mockRpoSeconds: 3.2,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('PASSED');
      expect(result.scenario).toBe(GameDayScenario.NETWORK_BLACKHOLE);
      expect(result.rto.actualSeconds).toBe(22.1);
      expect(result.rpo.actualSeconds).toBe(3.2);

      const steps = result.report.stepLogs.map((l) => l.step);
      expect(steps).toContain('TRIGGER_ALERT_CASCADE_AND_CIRCUITS');
      expect(steps).toContain('MULTI_REGION_TRAFFIC_FAILOVER');
    });
  });

  describe('Status Tracking & Concurrency Protection', () => {
    it('should report IDLE status when no drill is running', () => {
      const status = service.getStatus();
      expect(status.status).toBe(DrillStatus.IDLE);
      expect(status.activeDrill).toBeNull();
      expect(status.availableScenarios).toEqual([
        GameDayScenario.PRIMARY_DB_CRASH,
        GameDayScenario.REDIS_CLUSTER_SPLIT,
        GameDayScenario.NETWORK_BLACKHOLE,
      ]);
      expect(status.slaTargets).toEqual({
        rtoSeconds: 30,
        rpoSeconds: 5,
      });
    });

    it('should store reports and allow retrieval by drillId', async () => {
      const { drillId } = await service.startDrill({ dryRun: true });

      const reports = service.getReports();
      expect(reports.length).toBe(1);
      expect(reports[0].drillId).toBe(drillId);

      const fetched = service.getReportById(drillId);
      expect(fetched.drillId).toBe(drillId);
    });

    it('should throw NotFoundException for unknown drillId', () => {
      expect(() => service.getReportById('nonexistent-id')).toThrow(
        NotFoundException,
      );
    });

    it('should handle abort request gracefully', () => {
      const abortRes = service.abortDrill();
      expect(abortRes.aborted).toBe(false);
      expect(abortRes.message).toContain('No active Game-Day drill');
    });
  });

  describe('Scheduled Quarterly Drills', () => {
    it('should run quarterly scheduled drill when environment is allowed', async () => {
      const startSpy = jest.spyOn(service, 'startDrill');
      await service.handleQuarterlyScheduledDrill();
      expect(startSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: GameDayScenario.PRIMARY_DB_CRASH,
          triggeredBy: 'SCHEDULED_QUARTERLY_CRON',
        }),
      );
    });

    it('should skip quarterly scheduled drill when environment is production without override', async () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      });

      const startSpy = jest.spyOn(service, 'startDrill');
      await service.handleQuarterlyScheduledDrill();
      expect(startSpy).not.toHaveBeenCalled();
    });
  });
});
