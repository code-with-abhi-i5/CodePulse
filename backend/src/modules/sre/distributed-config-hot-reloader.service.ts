import crypto from 'crypto';
import { ConfigVersion } from '../../types/sre';

export class DistributedConfigHotReloader {
  private currentConfig: ConfigVersion;

  constructor(initialFlags: Record<string, boolean | string | number> = {}) {
    const raw = JSON.stringify(initialFlags);
    this.currentConfig = {
      version: 1,
      flags: { ...initialFlags },
      timestamp: Date.now(),
      hash: crypto.createHash('sha256').update(raw).digest('hex')
    };
  }

  getCurrentConfig(): ConfigVersion {
    return { ...this.currentConfig };
  }

  getFlag(key: string): boolean | string | number | undefined {
    return this.currentConfig.flags[key];
  }

  reloadFlags(newFlags: Record<string, boolean | string | number>): { changed: boolean; version: number } {
    const raw = JSON.stringify(newFlags);
    const newHash = crypto.createHash('sha256').update(raw).digest('hex');

    if (newHash === this.currentConfig.hash) {
      return { changed: false, version: this.currentConfig.version };
    }

    this.currentConfig = {
      version: this.currentConfig.version + 1,
      flags: { ...newFlags },
      timestamp: Date.now(),
      hash: newHash
    };

    return { changed: true, version: this.currentConfig.version };
  }
}
