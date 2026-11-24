import { SavingsLedgerService } from './savings-ledger.service';
import { FinOpsReaperService, CloudResourceCandidate } from './finops-reaper.service';

describe('FinOpsReaperService (#1420)', () => {
  let ledger: SavingsLedgerService;
  let reaper: FinOpsReaperService;

  beforeEach(() => {
    ledger = new SavingsLedgerService();
    reaper = new FinOpsReaperService(ledger);
  });

  afterEach(() => {
    ledger.clear();
  });

  it('should terminate unattached orphaned disks and log monthly savings', async () => {
    const candidates: CloudResourceCandidate[] = [
      {
        resourceId: 'vol-0a1b2c3d4e',
        provider: 'AWS',
        type: 'ORPHANED_DISK',
        region: 'us-east-1',
        sizeGb: 100, // 100GB * $0.08 = $8.00/mo
        idleHours: 48,
      },
    ];

    const report = await reaper.executeReaperCycle(candidates);

    expect(report.scannedCount).toBe(1);
    expect(report.reapedCount).toBe(1);
    expect(report.totalCycleMonthlySavingsUsd).toBe(8.0);

    const summary = ledger.getSummary();
    expect(summary.totalMonthlySavingsUsd).toBe(8.0);
    expect(summary.savingsByProvider.AWS).toBe(8.0);
    expect(summary.savingsByResourceType.ORPHANED_DISK).toBe(8.0);
  });

  it('should terminate unattached elastic IPs and idle test runner pods', async () => {
    const candidates: CloudResourceCandidate[] = [
      {
        resourceId: 'eipalloc-12345678',
        provider: 'AWS',
        type: 'UNATTACHED_IP',
        region: 'us-west-2',
        idleHours: 72,
      },
      {
        resourceId: 'runner-pod-job-9988',
        provider: 'GCP',
        type: 'IDLE_POD',
        region: 'us-central1',
        idleHours: 6,
      },
    ];

    const report = await reaper.executeReaperCycle(candidates);
    expect(report.reapedCount).toBe(2);
    // EIP (~$3.65) + Runner Pod (~$45.00) = $48.65
    expect(report.totalCycleMonthlySavingsUsd).toBeGreaterThanOrEqual(48.0);

    const summary = ledger.getSummary();
    expect(summary.savingsByResourceType.UNATTACHED_IP).toBeGreaterThan(0);
    expect(summary.savingsByResourceType.IDLE_POD).toBe(45.0);
  });

  it('should strictly skip protected and production tagged resources', async () => {
    const candidates: CloudResourceCandidate[] = [
      {
        resourceId: 'vol-prod-db-snapshot',
        provider: 'AWS',
        type: 'ORPHANED_DISK',
        region: 'us-east-1',
        sizeGb: 500,
        idleHours: 100,
        tags: { env: 'production' }, // Production tag
      },
      {
        resourceId: 'vol-protected-archive',
        provider: 'GCP',
        type: 'ORPHANED_DISK',
        region: 'europe-west1',
        sizeGb: 200,
        idleHours: 200,
        isProtected: true, // Explicit protection flag
      },
      {
        resourceId: 'vol-waste-scratch',
        provider: 'AWS',
        type: 'ORPHANED_DISK',
        region: 'us-east-1',
        sizeGb: 100,
        idleHours: 48,
        tags: { env: 'test' },
      },
    ];

    const report = await reaper.executeReaperCycle(candidates);

    expect(report.scannedCount).toBe(3);
    expect(report.skippedProtectedCount).toBe(2);
    expect(report.reapedCount).toBe(1);
    expect(report.reapedEntries[0].resourceId).toBe('vol-waste-scratch');
  });

  it('should ignore resources below minimum idle thresholds', async () => {
    const candidates: CloudResourceCandidate[] = [
      {
        resourceId: 'pod-fresh-1',
        provider: 'AWS',
        type: 'IDLE_POD',
        region: 'us-east-1',
        idleHours: 0.5, // Only 30 minutes idle (< 2h min)
      },
    ];

    const report = await reaper.executeReaperCycle(candidates);
    expect(report.reapedCount).toBe(0);
  });

  it('should satisfy the benchmark of cutting idle waste by > 35%', async () => {
    const candidates: CloudResourceCandidate[] = [
      // 1 protected volume ($8/mo)
      {
        resourceId: 'vol-keep-prod',
        provider: 'AWS',
        type: 'ORPHANED_DISK',
        region: 'us-east-1',
        sizeGb: 100,
        idleHours: 100,
        tags: { env: 'prod' },
      },
      // 3 idle runner pods ($45 * 3 = $135/mo)
      {
        resourceId: 'pod-1',
        provider: 'GCP',
        type: 'IDLE_POD',
        region: 'us-central1',
        idleHours: 10,
      },
      {
        resourceId: 'pod-2',
        provider: 'GCP',
        type: 'IDLE_POD',
        region: 'us-central1',
        idleHours: 10,
      },
      {
        resourceId: 'pod-3',
        provider: 'GCP',
        type: 'IDLE_POD',
        region: 'us-central1',
        idleHours: 10,
      },
    ];

    const report = await reaper.executeReaperCycle(candidates);

    expect(report.reapedCount).toBe(3);
    // $135 cut out of $143 total idle spend = ~94.4% waste reduction (> 35%)
    expect(report.wasteReductionPercent).toBeGreaterThanOrEqual(35.0);
  });
});
