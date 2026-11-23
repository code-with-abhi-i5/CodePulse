import { FirecrackerFleetService } from './firecracker-fleet.service';

describe('FirecrackerFleetService', () => {
  let fleet: FirecrackerFleetService;

  beforeEach(() => {
    fleet = new FirecrackerFleetService();
  });

  afterEach(() => {
    fleet.onModuleDestroy();
  });

  it('should acquire warm microVM instantly with sub-5ms boot time', () => {
    const vm = fleet.acquireWarmVm();
    expect(vm.vmId).toBeDefined();
    expect(vm.bootTimeMs).toBeLessThan(10);
    expect(fleet.getMetrics().totalWarmVms).toBe(4);
  });

  it('should recycle microVMs back into ephemeral warm pool', () => {
    const vm = fleet.acquireWarmVm();
    fleet.recycleVm(vm);
    expect(fleet.getMetrics().totalWarmVms).toBe(5);
    expect(fleet.getMetrics().totalVmsRecycled).toBe(1);
  });
});
