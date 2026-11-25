/**
 * Architecture Service: Ephemeral Preview Environment Deployer
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-05]
 */

export interface PreviewEnv {
  prNumber: number;
  namespace: string;
  subdomain: string;
  status: 'provisioning' | 'ready' | 'teardown';
  createdAt: number;
  ttlMs: number;
}

export class EphemeralPreviewDeployerService {
  private envs: Map<number, PreviewEnv>;
  private baseDomain: string;
  private defaultTtlMs: number;

  constructor(baseDomain: string = 'preview.codepulse.io', defaultTtlMs: number = 86400000) {
    this.envs = new Map();
    this.baseDomain = baseDomain;
    this.defaultTtlMs = defaultTtlMs;
  }

  public provision(prNumber: number): PreviewEnv {
    const namespace = 'pr-' + prNumber;
    const subdomain = 'pr-' + prNumber + '.' + this.baseDomain;
    const env: PreviewEnv = {
      prNumber,
      namespace,
      subdomain,
      status: 'ready',
      createdAt: Date.now(),
      ttlMs: this.defaultTtlMs
    };
    this.envs.set(prNumber, env);
    return env;
  }

  public teardown(prNumber: number): boolean {
    const env = this.envs.get(prNumber);
    if (!env) return false;
    env.status = 'teardown';
    this.envs.delete(prNumber);
    return true;
  }

  public getEnv(prNumber: number): PreviewEnv | null {
    return this.envs.get(prNumber) || null;
  }

  public cleanExpired(now: number = Date.now()): number {
    let count = 0;
    for (const [pr, env] of this.envs.entries()) {
      if (now >= env.createdAt + env.ttlMs) {
        this.envs.delete(pr);
        count++;
      }
    }
    return count;
  }
}
