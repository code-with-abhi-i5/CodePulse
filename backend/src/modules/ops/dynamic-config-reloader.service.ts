import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EtcdWatcherService, EtcdWatchEvent } from './etcd-watcher.service';

export interface RateLimitParam {
  rpm: number;
  burst: number;
}

export interface DynamicAppConfig {
  version: number;
  featureFlags: Record<string, boolean>;
  rateLimits: Record<string, RateLimitParam>;
  scoringWeights: Record<string, number>;
  updatedAt: Date;
}

export interface ConfigReloadResult {
  success: boolean;
  revision: number;
  appliedConfig: DynamicAppConfig;
  error?: string;
  rollbackPerformed?: boolean;
}

export interface ConfigSnapshot {
  revision: number;
  config: DynamicAppConfig;
  timestamp: Date;
}

@Injectable()
export class DynamicConfigReloaderService implements OnModuleInit {
  private readonly logger = new Logger(DynamicConfigReloaderService.name);
  public static readonly CONFIG_PREFIX = '/codepulse/config/';

  // Atomic in-memory configuration reference
  private activeConfig: DynamicAppConfig = {
    version: 1,
    featureFlags: {
      enableAiHintEngine: true,
      enableRealtimeCollaboration: true,
      enableGamificationV2: false,
      enableBetaCompiler: false,
    },
    rateLimits: {
      apiGateway: { rpm: 120, burst: 30 },
      compilerSandbox: { rpm: 30, burst: 5 },
      authEndpoint: { rpm: 20, burst: 5 },
    },
    scoringWeights: {
      speed: 0.35,
      accuracy: 0.45,
      memory: 0.20,
    },
    updatedAt: new Date(),
  };

  private readonly historySnapshots: ConfigSnapshot[] = [];
  private readonly maxSnapshots = 20;

  constructor(private readonly etcdWatcher: EtcdWatcherService) {}

  onModuleInit(): void {
    this.saveSnapshot(this.etcdWatcher.getRevision(), this.activeConfig);

    // Watch config prefix for live zero-downtime hot-reloads
    this.etcdWatcher.watchPrefix(DynamicConfigReloaderService.CONFIG_PREFIX, async (event) => {
      await this.handleEtcdConfigEvent(event);
    });
  }

  public getConfig(): DynamicAppConfig {
    return { ...this.activeConfig };
  }

  public getFeatureFlag(flagName: string): boolean {
    return !!this.activeConfig.featureFlags[flagName];
  }

  public getRateLimit(serviceName: string): RateLimitParam | undefined {
    return this.activeConfig.rateLimits[serviceName];
  }

  public getScoringWeights(): Record<string, number> {
    return { ...this.activeConfig.scoringWeights };
  }

  /**
   * Applies an update from etcd watcher with atomic rollback on failure.
   */
  public async handleEtcdConfigEvent(event: EtcdWatchEvent): Promise<ConfigReloadResult> {
    const startTime = Date.now();
    const previousSnapshot = this.historySnapshots[0]?.config || this.activeConfig;

    try {
      if (event.type === 'DELETE') {
        throw new Error(`Critical config path ${event.key} cannot be deleted`);
      }

      // 1. Syntax & JSON parse validation
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(event.value);
      } catch (jsonErr: any) {
        throw new Error(`Config JSON syntax error: ${jsonErr.message}`);
      }

      // 2. Schema integrity validation
      this.validateConfigSchema(parsedPayload);

      // 3. Construct new candidate configuration
      const candidate: DynamicAppConfig = {
        version: event.revision,
        featureFlags: { ...this.activeConfig.featureFlags, ...(parsedPayload.featureFlags || {}) },
        rateLimits: { ...this.activeConfig.rateLimits, ...(parsedPayload.rateLimits || {}) },
        scoringWeights: { ...this.activeConfig.scoringWeights, ...(parsedPayload.scoringWeights || {}) },
        updatedAt: new Date(),
      };

      // 4. Atomic pointer swap (zero-downtime)
      this.activeConfig = candidate;
      this.saveSnapshot(event.revision, candidate);

      const elapsedMs = Date.now() - startTime;
      this.logger.log(
        `Dynamic config hot-reloaded successfully to rev=${event.revision} in ${elapsedMs}ms (<100ms SLA)`,
      );

      return {
        success: true,
        revision: event.revision,
        appliedConfig: this.activeConfig,
      };
    } catch (err: any) {
      // 5. Automatic Atomic Rollback
      this.logger.error(
        `Config hot-reload validation failed! Triggering automatic rollback: ${err.message}`,
      );

      this.activeConfig = { ...previousSnapshot };

      return {
        success: false,
        revision: event.revision,
        appliedConfig: this.activeConfig,
        error: err.message,
        rollbackPerformed: true,
      };
    }
  }

  /**
   * Manual rollback to a specific revision.
   */
  public rollbackToRevision(targetRevision: number): boolean {
    const match = this.historySnapshots.find((s) => s.revision === targetRevision);
    if (!match) {
      this.logger.warn(`Cannot rollback: revision ${targetRevision} not found in history snapshots`);
      return false;
    }

    this.activeConfig = { ...match.config, updatedAt: new Date() };
    this.logger.warn(`Configuration atomically rolled back to revision ${targetRevision}`);
    return true;
  }

  /**
   * Strict schema validation for dynamic parameters.
   */
  public validateConfigSchema(payload: any): void {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Config payload must be a non-null object');
    }

    // Validate feature flags
    if (payload.featureFlags) {
      for (const [k, v] of Object.entries(payload.featureFlags)) {
        if (typeof v !== 'boolean') {
          throw new Error(`Feature flag '${k}' must be a boolean`);
        }
      }
    }

    // Validate rate limits
    if (payload.rateLimits) {
      for (const [service, limit] of Object.entries(payload.rateLimits) as [string, any][]) {
        if (!limit || typeof limit.rpm !== 'number' || limit.rpm <= 0) {
          throw new Error(`Rate limit for '${service}' must define positive rpm`);
        }
        if (typeof limit.burst !== 'number' || limit.burst < 0) {
          throw new Error(`Rate limit for '${service}' must define non-negative burst`);
        }
      }
    }

    // Validate scoring weights (must sum to ~1.0 if provided)
    if (payload.scoringWeights) {
      let sum = 0;
      for (const [dimension, weight] of Object.entries(payload.scoringWeights) as [string, any][]) {
        if (typeof weight !== 'number' || weight < 0) {
          throw new Error(`Scoring weight for '${dimension}' must be positive number`);
        }
        sum += weight;
      }
      if (Math.abs(sum - 1.0) > 0.05) {
        throw new Error(`Scoring weights must sum to 1.0 (got ${sum})`);
      }
    }
  }

  public getHistorySnapshots(): ConfigSnapshot[] {
    return [...this.historySnapshots];
  }

  private saveSnapshot(revision: number, config: DynamicAppConfig): void {
    this.historySnapshots.unshift({
      revision,
      config: { ...config },
      timestamp: new Date(),
    });
    if (this.historySnapshots.length > this.maxSnapshots) {
      this.historySnapshots.pop();
    }
  }

  public reset(): void {
    this.historySnapshots.length = 0;
    this.etcdWatcher.reset();
  }
}
