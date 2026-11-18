import { Test, TestingModule } from '@nestjs/testing';
import { MultiCloudDrService } from './multi-cloud-dr.service';

describe('MultiCloudDrService', () => {
  let service: MultiCloudDrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MultiCloudDrService],
    }).compile();

    service = module.get<MultiCloudDrService>(MultiCloudDrService);
    service.configure({
      failoverThreshold: 3,
      failoverTimeoutMs: 20000,
      primaryCloud: 'AWS',
      secondaryCloud: 'GCP',
    });
  });

  it('should initialize with normal failover state and AWS active traffic', () => {
    const report = service.generateReport();
    expect(report.dnsRouting.failoverState).toBe('NORMAL');
    expect(report.dnsRouting.activeTrafficCloud).toBe('AWS');
    expect(report.targetMetrics.rpo).toContain('0s');
    expect(report.targetMetrics.rto).toContain('20s');
  });

  it('should remain in NORMAL state if primary probe failures do not exceed threshold', async () => {
    // 1st failure
    let report = await service.evaluateHealthAndRunFailover(false, true);
    expect(report.primaryProbe.consecutiveFailures).toBe(1);
    expect(report.dnsRouting.activeTrafficCloud).toBe('AWS');
    expect(report.dnsRouting.failoverState).toBe('NORMAL');

    // 2nd failure
    report = await service.evaluateHealthAndRunFailover(false, true);
    expect(report.primaryProbe.consecutiveFailures).toBe(2);
    expect(report.dnsRouting.activeTrafficCloud).toBe('AWS');
    expect(report.dnsRouting.failoverState).toBe('NORMAL');

    // Recovery resets consecutive failures
    report = await service.evaluateHealthAndRunFailover(true, true);
    expect(report.primaryProbe.consecutiveFailures).toBe(0);
    expect(report.dnsRouting.activeTrafficCloud).toBe('AWS');
  });

  it('should trigger automated DNS failover to GCP when AWS fails 3 consecutive probes (RTO < 20s)', async () => {
    const mockDnsAdapter = {
      updateDnsRouting: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          success: true,
          durationMs: 400,
        });
      }),
    };
    service.setDnsAdapter(mockDnsAdapter);

    // Probe 1: Fail
    await service.evaluateHealthAndRunFailover(false, true);
    // Probe 2: Fail
    await service.evaluateHealthAndRunFailover(false, true);
    // Probe 3: Fail (Threshold reached -> Triggers Failover to GCP)
    const report = await service.evaluateHealthAndRunFailover(false, true);

    expect(mockDnsAdapter.updateDnsRouting).toHaveBeenCalledWith('GCP');
    expect(report.dnsRouting.activeTrafficCloud).toBe('GCP');
    expect(report.dnsRouting.failoverState).toBe('FAILED_OVER');
    expect(report.dnsRouting.lastFailoverDurationMs).toBeLessThanOrEqual(20000);
  });

  it('should initiate graceful failback to AWS when primary cloud recovers', async () => {
    const mockDnsAdapter = {
      updateDnsRouting: jest
        .fn()
        .mockResolvedValue({ success: true, durationMs: 300 }),
    };
    service.setDnsAdapter(mockDnsAdapter);

    // Trigger failover to GCP
    await service.evaluateHealthAndRunFailover(false, true);
    await service.evaluateHealthAndRunFailover(false, true);
    let report = await service.evaluateHealthAndRunFailover(false, true);
    expect(report.dnsRouting.activeTrafficCloud).toBe('GCP');

    // Primary AWS recovers
    report = await service.evaluateHealthAndRunFailover(true, true);
    expect(mockDnsAdapter.updateDnsRouting).toHaveBeenCalledWith('AWS');
    expect(report.dnsRouting.activeTrafficCloud).toBe('AWS');
    expect(report.dnsRouting.failoverState).toBe('NORMAL');
  });

  it('should resolve database replication conflicts using Last-Write-Wins (LWW)', () => {
    const localOlder = {
      id: 'repo-1',
      stars: 100,
      updatedAt: '2026-11-17T10:00:00Z',
    };
    const remoteNewer = {
      id: 'repo-1',
      stars: 120,
      updatedAt: '2026-11-17T10:00:05Z',
    };

    const resolved = service.resolveDataConflict(localOlder, remoteNewer);
    expect(resolved).toEqual(remoteNewer);
    expect(resolved.stars).toBe(120);

    // If local is newer, local should win
    const localNewest = {
      id: 'repo-1',
      stars: 150,
      updatedAt: '2026-11-17T10:00:10Z',
    };
    const resolvedLocal = service.resolveDataConflict(localNewest, remoteNewer);
    expect(resolvedLocal).toEqual(localNewest);
    expect(resolvedLocal.stars).toBe(150);
  });

  it('should replicate and verify session continuity across cloud boundaries via tunnel', () => {
    service.replicateSessionToken('jwt-session-xyz', 'user-42', 3600);

    const session = service.getSessionToken('jwt-session-xyz');
    expect(session).not.toBeNull();
    expect(session?.userId).toBe('user-42');

    const report = service.generateReport();
    expect(report.sessionContinuity.replicatedTokensCount).toBe(1);
    expect(report.sessionContinuity.wireguardTunnelActive).toBe(true);
  });
});
