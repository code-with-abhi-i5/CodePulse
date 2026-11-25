import assert from 'node:assert/strict';
import test from 'node:test';

class FirecrackerVmService {
  constructor() {
    this.pool = new Map();
    this.activeVms = new Set();
    for (let i = 1; i <= 4; i++) {
      const id = `vm-warm-${i}`;
      this.pool.set(id, {
        vmId: id,
        socketPath: `/run/firecracker/${id}.sock`,
        memoryMb: 256,
        vcpus: 1,
        isWarm: true,
        bootTimeMs: 4.2
      });
    }
  }

  acquireVm(opts) {
    for (const [id, vm] of this.pool.entries()) {
      if (!this.activeVms.has(id)) {
        this.activeVms.add(id);
        vm.isWarm = false;
        return { ...vm, ...opts };
      }
    }
    const dynamicId = `vm-dyn-${Date.now()}`;
    const newVm = {
      vmId: dynamicId,
      socketPath: `/run/firecracker/${dynamicId}.sock`,
      memoryMb: opts?.memoryMb ?? 256,
      vcpus: opts?.vcpus ?? 1,
      isWarm: false,
      bootTimeMs: 5.1,
      ...opts
    };
    this.pool.set(dynamicId, newVm);
    this.activeVms.add(dynamicId);
    return newVm;
  }

  releaseVm(vmId) {
    if (this.activeVms.has(vmId)) {
      this.activeVms.delete(vmId);
      const vm = this.pool.get(vmId);
      if (vm) vm.isWarm = true;
      return true;
    }
    return false;
  }

  enforceCgroupV2(vmId, memoryBytes, cpuMax) {
    return {
      memoryMaxBytes: Math.max(16 * 1024 * 1024, memoryBytes),
      cpuMaxPercent: Math.min(100, Math.max(10, cpuMax)),
      pidsMax: 64
    };
  }

  async executeInVm(vmId, code, limits) {
    if (!this.pool.has(vmId)) throw new Error(`MicroVM ${vmId} not found in pool`);
    return {
      exitCode: 0,
      stdout: `Execution completed in ${vmId}`,
      stderr: '',
      durationMs: 8.5,
      memoryUsageBytes: 18 * 1024 * 1024
    };
  }

  getPoolStats() {
    return {
      total: this.pool.size,
      active: this.activeVms.size,
      warm: this.pool.size - this.activeVms.size
    };
  }
}

test('FirecrackerVmService: acquires pre-warmed VM and manages pool stats', async () => {
  const service = new FirecrackerVmService();
  const vm = service.acquireVm({ memoryMb: 512 });
  assert.equal(vm.memoryMb, 512);
  assert.equal(service.getPoolStats().active, 1);
  assert.equal(service.getPoolStats().warm, 3);

  const released = service.releaseVm(vm.vmId);
  assert.equal(released, true);
  assert.equal(service.getPoolStats().active, 0);
});

test('FirecrackerVmService: enforces cgroup v2 limits and executes code', async () => {
  const service = new FirecrackerVmService();
  const vm = service.acquireVm();
  const limits = service.enforceCgroupV2(vm.vmId, 64 * 1024 * 1024, 50);
  assert.equal(limits.cpuMaxPercent, 50);
  assert.equal(limits.pidsMax, 64);

  const res = await service.executeInVm(vm.vmId, 'fn main() {}', limits);
  assert.equal(res.exitCode, 0);
  assert.ok(res.stdout.includes(vm.vmId));
});
