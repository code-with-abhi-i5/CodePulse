/**
 * Architecture Service: Frontend Feature Flag Provider
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-55]
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  defaultValue?: boolean;
}

export class FrontendFeatureFlagService {
  private flags: Map<string, FeatureFlag>;

  constructor() {
    this.flags = new Map();
  }

  public registerFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }

  public evaluate(key: string, userId: string = ''): boolean {
    const flag = this.flags.get(key);
    if (!flag) return false;
    if (!flag.enabled) return false;
    if (flag.rolloutPercentage !== undefined) {
      const hash = this.computeHash(userId + key);
      return (hash % 100) < flag.rolloutPercentage;
    }
    return flag.enabled;
  }

  private computeHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
