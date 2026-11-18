import { Test, TestingModule } from '@nestjs/testing';
import { HealthController, StartGameDayDrillDto } from './health.controller';
import {
  GameDayRunnerService,
  GameDayScenario,
  DrillStatus,
} from './gameday-runner.service';
import {
  MultiCloudDrService,
  MultiCloudDrReport,
  CloudProvider,
} from './multi-cloud-dr.service';

describe('HealthController - Multi-Cloud Disaster Recovery', () => {
  let controller: HealthController;
  let service: MultiCloudDrService;

  const mockReport: MultiCloudDrReport = {
    generatedAt: new Date().toISOString(),
    primaryCloud: 'AWS',
    activeSecondaryClouds: ['GCP', 'AZURE'],
    overallHealth: 'HEALTHY',
    crossCloudDnsLatencyMs: 24,
    failoverReadiness: 'READY',
    dnsFailoverTarget: 'AWS',
    heartbeats: [
      {
        provider: 'AWS',
        status: 'UP',
        latencyMs: 12,
        lastHeartbeat: new Date().toISOString(),
        region: 'us-east-1',
        consecutiveFailures: 0,
      },
      {
        provider: 'GCP',
        status: 'UP',
        latencyMs: 18,
        lastHeartbeat: new Date().toISOString(),
        region: 'us-central1',
        consecutiveFailures: 0,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: MultiCloudDrService,
          useValue: {
            generateReport: jest.fn().mockReturnValue(mockReport),
            triggerDnsFailover: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<MultiCloudDrService>(MultiCloudDrService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return DR report from service', () => {
    const report = controller.getDrReport();
    expect(report).toEqual(mockReport);
    expect(service.generateReport).toHaveBeenCalled();
  });

  it('should trigger manual failover and return new status', async () => {
    const result = await controller.triggerFailover('GCP');
    expect(service.triggerDnsFailover).toHaveBeenCalledWith('GCP');
    expect(result.success).toBe(true);
    expect(result.targetCloud).toBe('GCP');
  });
});

describe('HealthController - Game-Day Chaos Drills', () => {
  let controller: HealthController;
  let gamedayService: Partial<GameDayRunnerService>;

  const mockReport = {
    drillId: 'gameday-123',
    scenario: GameDayScenario.PRIMARY_DB_CRASH,
    environment: 'staging',
    triggeredBy: 'ADMIN_TRIGGER',
    startedAt: '2026-11-17T00:00:00.000Z',
    completedAt: '2026-11-17T00:00:15.000Z',
    durationMs: 15000,
    status: 'PASSED' as const,
    rto: {
      targetSeconds: 30,
      actualSeconds: 14.2,
      slaMet: true,
      unit: 'seconds',
    },
    rpo: {
      targetSeconds: 5,
      actualSeconds: 1.1,
      slaMet: true,
      unit: 'seconds',
    },
    singlePointsOfFailure: ['Single primary database replica'],
    recoveryBottlenecks: ['DNS TTL caching delay'],
    actionItems: ['Configure Multi-AZ RDS proxy'],
    stepLogs: [],
    auditSignature: 'a'.repeat(64),
  };

  beforeEach(async () => {
    gamedayService = {
      startDrill: jest.fn().mockResolvedValue({
        success: true,
        drillId: mockReport.drillId,
        status: mockReport.status,
        scenario: mockReport.scenario,
        environment: mockReport.environment,
        rtoSeconds: mockReport.rto.actualSeconds,
        slaMet: true,
        report: mockReport,
      }),
      getStatus: jest.fn().mockReturnValue({
        active: false,
        lastDrillId: mockReport.drillId,
        lastReportSummary: {
          scenario: mockReport.scenario,
          status: mockReport.status,
          rtoSeconds: mockReport.rto.actualSeconds,
        },
      }),
      getReports: jest.fn().mockReturnValue([mockReport]),
      getReportById: jest.fn().mockReturnValue(mockReport),
      abortDrill: jest.fn().mockReturnValue({ aborted: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: GameDayRunnerService,
          useValue: gamedayService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should start drill successfully', async () => {
    const dto: StartGameDayDrillDto = {
      scenario: GameDayScenario.PRIMARY_DB_CRASH,
      dryRun: true,
    };
    const res = await controller.startDrill(dto);
    expect(res.success).toBe(true);
    expect(gamedayService.startDrill).toHaveBeenCalledWith(dto);
  });

  it('should get status and reports', async () => {
    const status = await controller.getStatus();
    expect(status.lastDrillId).toBe('gameday-123');

    const list = await controller.getReports();
    expect(list.count).toBe(1);

    const single = await controller.getReportById('gameday-123');
    expect(single.drillId).toBe('gameday-123');
  });

  it('should abort drill', async () => {
    const res = await controller.abortDrill();
    expect(res.aborted).toBe(true);
    expect(gamedayService.abortDrill).toHaveBeenCalled();
  });
});
