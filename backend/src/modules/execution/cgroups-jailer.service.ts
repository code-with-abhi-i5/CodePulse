import { Injectable, Logger } from '@nestjs/common';
import { CgroupV2Limits } from './cgroups-jailer.types';

@Injectable()
export class CgroupsJailerService {
  private readonly logger = new Logger(CgroupsJailerService.name);

  public buildCgroupPath(sandboxId: string): string {
    return `/sys/fs/cgroup/codepulse/${sandboxId}`;
  }

  public generateCgroupConfig(memoryLimitMb = 256, maxProcesses = 16): CgroupV2Limits {
    return {
      memoryMaxBytes: memoryLimitMb * 1024 * 1024,
      cpuMaxQuotaUs: 100000, // 100ms
      cpuPeriodUs: 100000,
      pidsMax: maxProcesses,
    };
  }
}
