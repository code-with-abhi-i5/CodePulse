/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { GeoDnsService, IGeoDnsRoutingAdapter } from './geo-dns.service';
import { HealthController } from './health.controller';
import { BadRequestException } from '@nestjs/common';

describe('GeoDnsService & HealthController', () => {
  let service: GeoDnsService;
  let controller: HealthController;
  let mockAdapter: IGeoDnsRoutingAdapter;
  let updatedWeights: Record<string, number>;
  let reroutedTraffic: Array<{ from: string; to: string; reason: string }>;

  beforeEach(async () => {
    updatedWeights = {};
    reroutedTraffic = [];

    mockAdapter = {
      updateDnsWeight: jest.fn((region: string, weight: number) => {
        updatedWeights[region] = weight;
        return Promise.resolve(true);
      }),
      divertTraffic: jest.fn((from: string, to: string, reason: string) => {
        reroutedTraffic.push({ from, to, reason });
        return Promise.resolve(true);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [GeoDnsService],
    }).compile();

    service = module.get<GeoDnsService>(GeoDnsService);
    controller = module.get<HealthController>(HealthController);

    service.setRoutingAdapter(mockAdapter);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('10 Major Global Developer Hubs Initialization', () => {
    it('should initialize exactly 10 global developer hubs with healthy status', () => {
      const status = service.getGeoDnsStatus();
      expect(status.totalBeaconsCount).toBe(10);
      expect(status.healthyBeaconsCount).toBe(10);
      expect(status.degradedBeaconsCount).toBe(0);
      expect(status.engineStatus).toBe('ACTIVE');
      expect(status.sub30sFailoverActive).toBe(true);
      expect(status.routingProvider).toBe('ROUTE53_LBR');

      const regions = status.beacons.map((b) => b.region);
      expect(regions).toEqual(
        expect.arrayContaining([
          'us-east-1',
          'us-west-2',
          'eu-central-1',
          'eu-west-1',
          'ap-south-1',
          'ap-southeast-1',
          'ap-northeast-1',
          'sa-east-1',
          'ap-southeast-2',
          'me-central-1',
        ]),
      );
    });

    it('should calculate valid global average latency across all beacons', () => {
      const status = service.getGeoDnsStatus();
      expect(status.averageGlobalLatencyMs).toBeGreaterThan(0);
      expect(status.averageGlobalLatencyMs).toBeLessThan(100);
    });
  });

  describe('Sub-30-Second Failover & BGP Congestion Rerouting', () => {
    it('should failover and zero out DNS weight when 3 consecutive probe failures occur', async () => {
      // Simulate 3 failures in ap-south-1 (Mumbai / Bangalore)
      service.simulateProbeLatency('hub-ap-south', 300, 3);
      await service.evaluateBeaconHealth(service.getBeacon('hub-ap-south')!);

      const status = service.getGeoDnsStatus();
      const apSouth = service.getBeacon('hub-ap-south');

      expect(apSouth).toBeDefined();
      expect(apSouth?.isDegraded).toBe(true);
      expect(apSouth?.activeDnsWeight).toBe(0);
      expect(status.degradedBeaconsCount).toBe(1);
      expect(mockAdapter.updateDnsWeight).toHaveBeenCalledWith('ap-south-1', 0);
      expect(mockAdapter.divertTraffic).toHaveBeenCalledWith(
        'ap-south-1',
        'eu-central-1',
        expect.stringContaining('Sub-30s Automated Failover'),
      );
    });

    it('should reroute Indian traffic (ap-south-1) to Frankfurt (eu-central-1) on severe latency spike', async () => {
      // ap-south-1 baseline is 32ms. 32 * 2.5 = 80ms threshold.
      service.simulateProbeLatency('hub-ap-south', 145, 0); // Latency surge e.g. submarine cable cut
      await service.evaluateBeaconHealth(service.getBeacon('hub-ap-south')!);

      expect(mockAdapter.divertTraffic).toHaveBeenCalledWith(
        'ap-south-1',
        'eu-central-1',
        expect.stringContaining('Active BGP Latency Surge'),
      );

      const apSouth = service.getBeacon('hub-ap-south');
      expect(apSouth?.isDegraded).toBe(true);
      expect(apSouth?.activeDnsWeight).toBe(0);
    });

    it('should find optimal alternative regions for all global hubs', () => {
      expect(service.findOptimalAlternativeRegion('ap-south-1')).toBe(
        'eu-central-1',
      );
      expect(service.findOptimalAlternativeRegion('ap-southeast-1')).toBe(
        'ap-northeast-1',
      );
      expect(service.findOptimalAlternativeRegion('ap-northeast-1')).toBe(
        'us-west-2',
      );
      expect(service.findOptimalAlternativeRegion('us-east-1')).toBe(
        'us-west-2',
      );
      expect(service.findOptimalAlternativeRegion('us-west-2')).toBe(
        'us-east-1',
      );
      expect(service.findOptimalAlternativeRegion('eu-central-1')).toBe(
        'eu-west-1',
      );
      expect(service.findOptimalAlternativeRegion('eu-west-1')).toBe(
        'eu-central-1',
      );
      expect(service.findOptimalAlternativeRegion('sa-east-1')).toBe(
        'us-east-1',
      );
      expect(service.findOptimalAlternativeRegion('ap-southeast-2')).toBe(
        'ap-southeast-1',
      );
      expect(service.findOptimalAlternativeRegion('me-central-1')).toBe(
        'eu-central-1',
      );
    });

    it('should restore traffic (100% weight) when region recovers below threshold', async () => {
      // First degrade ap-south-1
      service.simulateProbeLatency('hub-ap-south', 200, 3);
      await service.evaluateBeaconHealth(service.getBeacon('hub-ap-south')!);
      expect(service.getBeacon('hub-ap-south')?.isDegraded).toBe(true);

      // Now recover ap-south-1
      service.simulateProbeLatency('hub-ap-south', 30, 0);
      await service.evaluateBeaconHealth(service.getBeacon('hub-ap-south')!);

      const beacon = service.getBeacon('hub-ap-south');
      expect(beacon?.isDegraded).toBe(false);
      expect(beacon?.activeDnsWeight).toBe(100);
      expect(mockAdapter.updateDnsWeight).toHaveBeenCalledWith(
        'ap-south-1',
        100,
      );
    });

    it('should switch engineStatus to FAILOVER_MODE if >= 4 regions degrade simultaneously', async () => {
      service.simulateProbeLatency('hub-na-east', 200, 3);
      service.simulateProbeLatency('hub-na-west', 200, 3);
      service.simulateProbeLatency('hub-eu-central', 200, 3);
      service.simulateProbeLatency('hub-ap-south', 200, 3);

      await service.evaluateBeaconHealth(service.getBeacon('hub-na-east')!);
      await service.evaluateBeaconHealth(service.getBeacon('hub-na-west')!);
      await service.evaluateBeaconHealth(service.getBeacon('hub-eu-central')!);
      await service.evaluateBeaconHealth(service.getBeacon('hub-ap-south')!);

      const status = service.getGeoDnsStatus();
      expect(status.degradedBeaconsCount).toBe(4);
      expect(status.engineStatus).toBe('FAILOVER_MODE');
    });
  });

  describe('HealthController REST Endpoints', () => {
    it('GET /health returns basic health status', () => {
      const res = controller.getHealth();
      expect(res.status).toBe('ok');
      expect(res.timestamp).toBeDefined();
    });

    it('GET /health/geo-dns returns operational status of 10 hubs', () => {
      const res = controller.getGeoDnsStatus();
      expect(res.totalBeaconsCount).toBe(10);
      expect(res.sub30sFailoverActive).toBe(true);
    });

    it('POST /health/geo-dns/divert manually diverts traffic between regions', async () => {
      const res = await controller.divertTraffic({
        fromRegion: 'ap-south-1',
        toRegion: 'eu-central-1',
        reason: 'Submarine cable maintenance drill',
      });

      expect(res.hubId).toBe('hub-ap-south');
      expect(res.originalAssignedRegion).toBe('ap-south-1');
      expect(res.optimizedTargetRegion).toBe('eu-central-1');
      expect(res.failoverTriggered).toBe(true);
      expect(mockAdapter.divertTraffic).toHaveBeenCalledWith(
        'ap-south-1',
        'eu-central-1',
        'Submarine cable maintenance drill',
      );
    });

    it('POST /health/geo-dns/divert rejects empty region parameters', async () => {
      await expect(
        controller.divertTraffic({ fromRegion: '', toRegion: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('POST /health/geo-dns/simulate-probe updates latency state', () => {
      const res = controller.simulateProbe({
        hubId: 'hub-eu-west',
        latencyMs: 95,
        consecutiveFailures: 2,
      });

      expect(res.success).toBe(true);
      expect(service.getBeacon('hub-eu-west')?.currentLatencyMs).toBe(95);
      expect(service.getBeacon('hub-eu-west')?.consecutiveFailures).toBe(2);
    });
  });
});
