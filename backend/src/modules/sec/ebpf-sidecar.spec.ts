import { Test, TestingModule } from '@nestjs/testing';
import { EbpfSidecarService } from './ebpf-sidecar.service';

describe('EbpfSidecarService', () => {
  let service: EbpfSidecarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EbpfSidecarService],
    }).compile();

    service = module.get<EbpfSidecarService>(EbpfSidecarService);
  });

  afterEach(() => {
    service.resetStats();
  });

  describe('Lifecycle and Hook Attachment', () => {
    it('should initialize and attach to network interface', () => {
      expect(service.isAttached()).toBe(true);
      expect(service.getAttachedInterface()).toBe('eth0');
    });

    it('should detach and re-attach to custom network interface', () => {
      const detached = service.detachXdpHook();
      expect(detached).toBe(true);
      expect(service.isAttached()).toBe(false);
      expect(service.getAttachedInterface()).toBeNull();

      service.attachXdpHook('cni0');
      expect(service.isAttached()).toBe(true);
      expect(service.getAttachedInterface()).toBe('cni0');
    });
  });

  describe('IP Blacklisting and Enforcement', () => {
    it('should drop packets from blacklisted IP immediately', () => {
      const attackerIp = '198.51.100.42';
      service.blacklistIp(attackerIp, 3600, 'Syn flood attack');

      expect(service.isIpBlacklisted(attackerIp)).toBe(true);
      const decision = service.processPacket(attackerIp);
      expect(decision).toBe('DROP');

      const stats = service.getTelemetryStats();
      expect(stats.droppedBlacklist).toBe(1);
      expect(stats.passedPackets).toBe(0);
    });

    it('should expire blacklisted IP after TTL passes', () => {
      const tempAttacker = '198.51.100.99';
      const t0 = 1000000;
      service.blacklistIp(tempAttacker, 10, 'Temporary block'); // 10s TTL

      // Immediately blocked
      expect(service.isIpBlacklisted(tempAttacker, t0)).toBe(true);

      // After 11s (11000ms), block expired
      expect(service.isIpBlacklisted(tempAttacker, t0 + 11000)).toBe(false);

      // Packet should now pass
      const action = service.processPacket(tempAttacker, t0 + 11000);
      expect(action).toBe('PASS');
    });

    it('should allow manual unblacklisting', () => {
      const ip = '198.51.100.5';
      service.blacklistIp(ip, 3600);
      expect(service.unblacklistIp(ip)).toBe(true);
      expect(service.isIpBlacklisted(ip)).toBe(false);
    });
  });

  describe('Token Bucket Rate Limiting', () => {
    it('should allow burst packets up to capacity then drop excess packets', () => {
      const clientIp = '203.0.113.10';
      // 5 tokens capacity, 2 tokens/sec refill
      service.setIpRateLimit(clientIp, {
        refillRatePerSec: 2,
        burstCapacity: 5,
      });

      const t0 = 1000000;

      // Consume first 5 burst packets
      for (let i = 0; i < 5; i++) {
        expect(service.processPacket(clientIp, t0)).toBe('PASS');
      }

      // 6th packet without time elapsed should be dropped
      expect(service.processPacket(clientIp, t0)).toBe('DROP');

      // Advance time by 1.5 seconds -> refills 3 tokens
      expect(service.processPacket(clientIp, t0 + 1500)).toBe('PASS');
      expect(service.processPacket(clientIp, t0 + 1500)).toBe('PASS');
      expect(service.processPacket(clientIp, t0 + 1500)).toBe('PASS');
      expect(service.processPacket(clientIp, t0 + 1500)).toBe('DROP');
    });

    it('should allow unregulated IP traffic to pass through', () => {
      const cleanIp = '10.0.0.1';
      expect(service.processPacket(cleanIp)).toBe('PASS');
      expect(service.getTelemetryStats().passedPackets).toBe(1);
    });
  });

  describe('High-Throughput Volumetric DoS Simulation', () => {
    it('should drop 99.9% of volumetric attack packets with low CPU footprint', () => {
      const botnetIp = '198.51.100.77';
      // Rate limit to 100 req/sec with burst 100
      service.setIpRateLimit(botnetIp, {
        refillRatePerSec: 100,
        burstCapacity: 100,
      });

      // Flood 10,000 packets in a single instant
      const result = service.simulateBatchVolumetricLoad(botnetIp, 10000);
      expect(result.passed).toBe(100);
      expect(result.dropped).toBe(9900);

      const stats = service.getTelemetryStats();
      expect(stats.dropRatePct).toBe(99);
      expect(stats.simulatedCpuLoadPct).toBeLessThan(1.0); // <1% CPU utilization
    });
  });
});
