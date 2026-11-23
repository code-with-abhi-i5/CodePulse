import { CgroupsJailerService } from './cgroups-jailer.service';

describe('CgroupsJailerService', () => {
  let jailer: CgroupsJailerService;

  beforeEach(() => {
    jailer = new CgroupsJailerService();
  });

  it('should generate strict cgroup v2 memory and PID bounds', () => {
    const limits = jailer.generateCgroupConfig(128, 8);
    expect(limits.memoryMaxBytes).toBe(128 * 1024 * 1024);
    expect(limits.pidsMax).toBe(8);
  });
});
