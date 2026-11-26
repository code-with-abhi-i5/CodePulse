import { EphemeralEnvSpec } from '../../types/sre';

export class EphemeralPreviewProvisioner {
  private environments: Map<string, EphemeralEnvSpec> = new Map();

  provision(prNumber: number, branch: string, ttlMinutes: number = 120): EphemeralEnvSpec {
    const envId = `pr-${prNumber}-${branch.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 15)}`;
    const spec: EphemeralEnvSpec = {
      envId,
      prNumber,
      branch,
      allocatedCpu: '500m',
      allocatedMemory: '1024Mi',
      ttlMinutes,
      createdAt: Date.now(),
      status: 'active'
    };
    this.environments.set(envId, spec);
    return spec;
  }

  getEnvironment(envId: string): EphemeralEnvSpec | undefined {
    return this.environments.get(envId);
  }

  reapExpired(): string[] {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, spec] of this.environments.entries()) {
      const ageMinutes = (now - spec.createdAt) / 60000;
      if (ageMinutes > spec.ttlMinutes) {
        spec.status = 'expired';
        expired.push(id);
        this.environments.delete(id);
      }
    }
    return expired;
  }
}
