import { Test, TestingModule } from '@nestjs/testing';
import { CloudflareDnsControllerService } from './cloudflare-dns-controller.service';
import { GeoDnsFailoverService, HealthCheckResult } from './geo-dns-failover.service';

describe('GeoDnsFailoverService & CloudflareDnsControllerService', () => {
  let dnsController: CloudflareDnsControllerService;
  let failoverService: GeoDnsFailoverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudflareDnsControllerService, GeoDnsFailoverService],
    }).compile();

    dnsController = module.get<CloudflareDnsControllerService>(CloudflareDnsControllerService);
    failoverService = module.get<GeoDnsFailoverService>(GeoDnsFailoverService);
    failoverService.initializeDefaultRegions();
  });

  afterEach(() => {
    failoverService.reset();
  });

  describe('Initialization and Region Registration', () => {
    it('should register default three Anycast regions as healthy', () => {
      const summary = dnsController.getActiveRoutingSummary();
      expect(summary.total).toBe(3);
      expect(summary.healthy).toBe(3);
      expect(summary.unhealthy).toBe(0);
      expect(summary.activeIpList.length).toBe(3);
    });

    it('should retrieve individual region telemetry', () => {
      const telemetry = failoverService.getRegionTelemetry('us-east-1');
      expect(telemetry.member).toBeDefined();
      expect(telemetry.member?.status).toBe('HEALTHY');
      expect(telemetry.consecutiveFailures).toBe(0);
    });
  });

  describe('Health Probing and Automated Failover', () => {
    it('should maintain region in rotation on single transient failure', async () => {
      const failProbe: HealthCheckResult = {
        healthy: false,
        statusCode: 504,
        latencyMs: 3100,
        timestamp: new Date(),
        error: 'Gateway Timeout',
      };

      await failoverService.processProbeResult('eu-west-1', failProbe);
      const member = dnsController.getPoolMember('eu-west-1');
      expect(member?.enabled).toBe(true);
      expect(member?.status).toBe('HEALTHY');

      const telemetry = failoverService.getRegionTelemetry('eu-west-1');
      expect(telemetry.consecutiveFailures).toBe(1);
    });

    it('should pull unhealthy region out of Anycast rotation on 2nd consecutive failure (<= 10s)', async () => {
      const failProbe: HealthCheckResult = {
        healthy: false,
        statusCode: 500,
        latencyMs: 450,
        timestamp: new Date(),
        error: 'Internal Server Error',
      };

      // Probe 1 (Failure 1)
      await failoverService.processProbeResult('ap-southeast-1', failProbe);
      expect(dnsController.getPoolMember('ap-southeast-1')?.enabled).toBe(true);

      // Probe 2 (Failure 2 -> threshold reached, triggers failover)
      await failoverService.processProbeResult('ap-southeast-1', failProbe);
      const member = dnsController.getPoolMember('ap-southeast-1');
      expect(member?.enabled).toBe(false);
      expect(member?.status).toBe('UNHEALTHY');

      // Verify routing summary updated
      const summary = dnsController.getActiveRoutingSummary();
      expect(summary.healthy).toBe(2);
      expect(summary.unhealthy).toBe(1);
      expect(summary.activeIpList).not.toContain('198.51.100.30');

      // Verify failover event history
      const history = failoverService.getFailoverHistory();
      expect(history.length).toBe(1);
      expect(history[0].action).toBe('FAILOVER_DISABLE');
      expect(history[0].regionId).toBe('ap-southeast-1');
    });

    it('should automatically re-add recovered data center after 3 consecutive healthy checks', async () => {
      // 1. Force region to unhealthy failover
      const failProbe: HealthCheckResult = {
        healthy: false,
        statusCode: 503,
        latencyMs: 120,
        timestamp: new Date(),
      };
      await failoverService.processProbeResult('us-east-1', failProbe);
      await failoverService.processProbeResult('us-east-1', failProbe);
      expect(dnsController.getPoolMember('us-east-1')?.enabled).toBe(false);

      // 2. Supply consecutive successful checks
      const healthyProbe: HealthCheckResult = {
        healthy: true,
        statusCode: 200,
        latencyMs: 45,
        timestamp: new Date(),
      };

      await failoverService.processProbeResult('us-east-1', healthyProbe); // 1
      expect(dnsController.getPoolMember('us-east-1')?.enabled).toBe(false);

      await failoverService.processProbeResult('us-east-1', healthyProbe); // 2
      expect(dnsController.getPoolMember('us-east-1')?.enabled).toBe(false);

      await failoverService.processProbeResult('us-east-1', healthyProbe); // 3 -> threshold reached!
      const recoveredMember = dnsController.getPoolMember('us-east-1');
      expect(recoveredMember?.enabled).toBe(true);
      expect(recoveredMember?.status).toBe('HEALTHY');

      const history = failoverService.getFailoverHistory();
      expect(history[0].action).toBe('RECOVERY_ENABLE');
      expect(history[0].regionId).toBe('us-east-1');
    });

    it('should guard last survivor when all other regions fail', async () => {
      const failProbe: HealthCheckResult = {
        healthy: false,
        statusCode: 503,
        latencyMs: 50,
        timestamp: new Date(),
      };

      // Disable 2 regions
      await failoverService.processProbeResult('us-east-1', failProbe);
      await failoverService.processProbeResult('us-east-1', failProbe);

      await failoverService.processProbeResult('eu-west-1', failProbe);
      await failoverService.processProbeResult('eu-west-1', failProbe);

      expect(dnsController.getActiveRoutingSummary().healthy).toBe(1);

      // Now 3rd region fails as well -> survivor guard should prevent 0 healthy regions
      await failoverService.processProbeResult('ap-southeast-1', failProbe);
      await failoverService.processProbeResult('ap-southeast-1', failProbe);

      const survivor = dnsController.getPoolMember('ap-southeast-1');
      expect(survivor?.enabled).toBe(true);
      expect(dnsController.getActiveRoutingSummary().healthy).toBe(1);
    });
  });
});
