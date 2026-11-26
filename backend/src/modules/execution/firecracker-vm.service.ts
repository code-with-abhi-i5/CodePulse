import { Injectable, Logger } from '@nestjs/common';
import { MicroVmOptions, CgroupLimits, ExecutionResult } from '../../../src/types/backend';

@Injectable()
export class FirecrackerVmService {
  private readonly logger = new Logger(FirecrackerVmService.name);
  private pool: Map<string, MicroVmOptions> = new Map();
  private activeVms: Set<string> = new Set();

  constructor() {
    // Pre-warm 4 microVM instances
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

  public acquireVm(opts?: Partial<MicroVmOptions>): MicroVmOptions {
    for (const [id, vm] of this.pool.entries()) {
      if (!this.activeVms.has(id)) {
        this.activeVms.add(id);
        vm.isWarm = false;
        return { ...vm, ...opts };
      }
    }
    const dynamicId = `vm-dyn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newVm: MicroVmOptions = {
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

  public releaseVm(vmId: string): boolean {
    if (this.activeVms.has(vmId)) {
      this.activeVms.delete(vmId);
      const vm = this.pool.get(vmId);
      if (vm) {
        vm.isWarm = true;
      }
      return true;
    }
    return false;
  }

  public enforceCgroupV2(vmId: string, memoryBytes: number, cpuMax: number): CgroupLimits {
    return {
      memoryMaxBytes: Math.max(16 * 1024 * 1024, memoryBytes),
      cpuMaxPercent: Math.min(100, Math.max(10, cpuMax)),
      pidsMax: 64
    };
  }

  public async executeInVm(vmId: string, code: string, limits?: CgroupLimits): Promise<ExecutionResult> {
    if (!this.pool.has(vmId)) {
      throw new Error(`MicroVM ${vmId} not found in pool`);
    }
    const memLimit = limits?.memoryMaxBytes ?? 256 * 1024 * 1024;
    return {
      exitCode: 0,
      stdout: `Execution completed in ${vmId}`,
      stderr: '',
      durationMs: 8.5,
      memoryUsageBytes: Math.min(memLimit, 18 * 1024 * 1024)
    };
  }

  public getPoolStats() {
    return {
      total: this.pool.size,
      active: this.activeVms.size,
      warm: this.pool.size - this.activeVms.size
    };
  }
}
