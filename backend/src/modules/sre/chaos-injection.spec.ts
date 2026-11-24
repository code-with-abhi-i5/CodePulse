import { LatencyInjectorService } from './latency-injector.service';
import {
  ChaosInjectionService,
  WorkerPodInstance,
} from './chaos-injection.service';

describe('ChaosInjectionService (#1421)', () => {
  let latencyInjector: LatencyInjectorService;
  let chaosService: ChaosInjectionService;

  beforeEach(() => {
    latencyInjector = new LatencyInjectorService();
    chaosService = new ChaosInjectionService(latencyInjector);
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    chaosService.clear();
  });

  describe('LatencyInjectorService (tc netem emulation)', () => {
    it('should configure delay, jitter, and packet loss rate', () => {
      latencyInjector.configureRule({
        delayMs: 150,
        jitterMs: 25,
        packetLossPercent: 10,
        enabled: true,
      });

      const rule = latencyInjector.getRule();
      expect(rule.delayMs).toBe(150);
      expect(rule.jitterMs).toBe(25);
      expect(rule.packetLossPercent).toBe(10);
      expect(rule.enabled).toBe(true);
    });

    it('should inject synthetic latency within jitter distribution', async () => {
      latencyInjector.configureRule({
        delayMs: 20,
        jitterMs: 5,
        enabled: true,
      });

      const start = Date.now();
      const injected = await latencyInjector.injectLatency();
      const elapsed = Date.now() - start;

      expect(injected).toBeGreaterThanOrEqual(15);
      expect(injected).toBeLessThanOrEqual(25);
      expect(elapsed).toBeGreaterThanOrEqual(14);
    });

    it('should evaluate packet drop probability correctly', () => {
      // 0% loss: never drops
      latencyInjector.configureRule({ packetLossPercent: 0, enabled: true });
      expect(latencyInjector.shouldDropPacket()).toBe(false);

      // 100% loss: always drops
      latencyInjector.configureRule({ packetLossPercent: 100, enabled: true });
      expect(latencyInjector.shouldDropPacket()).toBe(true);
    });
  });

  describe('ChaosInjectionService (Pod Kill & Failover)', () => {
    it('should terminate random worker pod and verify seamless session failover', async () => {
      const pods: WorkerPodInstance[] = [
        {
          podName: 'ws-gateway-worker-1',
          deployment: 'ws-gateway',
          status: 'RUNNING',
          activeBattleCount: 15,
          activeWebSocketSessions: 120,
        },
        {
          podName: 'ws-gateway-worker-2',
          deployment: 'ws-gateway',
          status: 'RUNNING',
          activeBattleCount: 20,
          activeWebSocketSessions: 150,
        },
        {
          podName: 'ws-gateway-worker-3',
          deployment: 'ws-gateway',
          status: 'RUNNING',
          activeBattleCount: 18,
          activeWebSocketSessions: 130,
        },
      ];

      const report = await chaosService.executeExperiment(
        {
          experimentType: 'POD_KILL',
          targetDeployment: 'ws-gateway',
          blastRadiusRatio: 0.33,
        },
        pods
      );

      expect(report.podsTerminated.length).toBe(1);
      expect(report.sessionsMigrated).toBe(120);
      expect(report.battlesFailedOver).toBe(15);
      expect(report.userInterruptionDetected).toBe(false);
      expect(report.resilienceScorePercent).toBe(100);

      const telemetry = chaosService.getTelemetry();
      expect(telemetry.totalPodsTerminated).toBe(1);
      expect(telemetry.totalSessionsRecovered).toBe(120);
      expect(telemetry.overallResilienceScore).toBe(100);
    });

    it('should strictly abort chaos injection in production environment', async () => {
      process.env.NODE_ENV = 'production';

      const pods: WorkerPodInstance[] = [
        {
          podName: 'prod-pod-1',
          deployment: 'prod-api',
          status: 'RUNNING',
          activeBattleCount: 50,
          activeWebSocketSessions: 500,
        },
      ];

      const report = await chaosService.executeExperiment(
        {
          experimentType: 'POD_KILL',
          targetDeployment: 'prod-api',
        },
        pods
      );

      // Must be 0 pods terminated in production
      expect(report.podsTerminated.length).toBe(0);
      expect(pods[0].status).toBe('RUNNING');
    });

    it('should reset network chaos rules during rollback', () => {
      latencyInjector.configureRule({ delayMs: 200, enabled: true });
      expect(latencyInjector.getRule().enabled).toBe(true);

      chaosService.rollbackChaos();
      expect(latencyInjector.getRule().enabled).toBe(false);
      expect(latencyInjector.getRule().delayMs).toBe(0);
    });
  });
});
