import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { z, ZodTypeAny } from 'zod';
import { EtcdWatcher, EtcdWatchEvent } from './etcd-watcher';

export interface AuditLogEntry {
  id: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  updatedBy: string;
  timestamp: string;
  status: 'APPLIED' | 'REJECTED';
  reason?: string;
  source: 'ADMIN_API' | 'ETCD_WATCHER' | 'INITIALIZATION';
}

/**
 * Strong Zod schema definitions for all dynamic platform configuration parameters.
 */
export const DynamicConfigSchema = z.object({
  FEATURE_BATTLES_ENABLED: z.boolean().default(true),
  FEATURE_CHALLENGES_ENABLED: z.boolean().default(true),
  FEATURE_GITHUB_SYNC_ENABLED: z.boolean().default(true),
  MAINTENANCE_MODE: z.boolean().default(false),
  ELO_K_FACTOR: z.number().min(8).max(64).default(32),
  MATCHMAKING_ELO_THRESHOLD: z.number().min(50).max(1000).default(200),
  MAX_CONCURRENT_MATCHES: z.number().min(1).max(500).default(50),
  RATE_LIMIT_QUOTA_DEFAULT: z.number().min(10).max(10000).default(60),
  SYNC_CRON_INTERVAL_MINUTES: z.number().min(1).max(1440).default(60),
  HEALTH_CHECK_INTERVAL_SECONDS: z.number().min(1).max(300).default(10),
});

export type DynamicConfigValues = z.infer<typeof DynamicConfigSchema>;
export type DynamicConfigKey = keyof DynamicConfigValues;

@Injectable()
export class DynamicConfigService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DynamicConfigService.name);
  private watcher: EtcdWatcher;
  private inMemoryConfig: DynamicConfigValues;
  private readonly auditLogs: AuditLogEntry[] = [];
  private readonly maxAuditLogs = 200;

  constructor() {
    this.inMemoryConfig = DynamicConfigSchema.parse({});
    this.watcher = new EtcdWatcher({
      prefix: '/codepulse/config/',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  /**
   * Initializes the distributed dynamic config watcher
   */
  async start(customWatcher?: EtcdWatcher): Promise<void> {
    if (customWatcher) {
      this.watcher = customWatcher;
    }

    this.watcher.on('change', (event: EtcdWatchEvent) => {
      this.handleEtcdChangeEvent(event);
    });

    await this.watcher.start();
    this.logger.log(
      'DynamicConfigService initialized with active etcd streaming watcher',
    );
  }

  async stop(): Promise<void> {
    await this.watcher.stop();
  }

  /**
   * Returns the entire in-memory configuration state atomically.
   */
  getAll(): DynamicConfigValues {
    return { ...this.inMemoryConfig };
  }

  /**
   * Get a specific configuration parameter by key.
   */
  get<K extends DynamicConfigKey>(key: K): DynamicConfigValues[K] {
    if (!(key in this.inMemoryConfig)) {
      throw new NotFoundException(
        `Configuration key "${String(key)}" is not defined`,
      );
    }
    return this.inMemoryConfig[key];
  }

  /**
   * Updates a configuration parameter atomically and propagates through etcd.
   * Validates schema with Zod prior to applying.
   */
  async set(
    key: string,
    rawValue: unknown,
    updatedBy = 'system',
  ): Promise<{ key: string; value: unknown; applied: boolean }> {
    const parsedKey = key.trim() as DynamicConfigKey;
    const shape = DynamicConfigSchema.shape as Record<string, ZodTypeAny>;
    const keySchema = shape[parsedKey];

    if (!keySchema) {
      const err = `Unknown configuration parameter "${key}". Available keys: ${Object.keys(shape).join(', ')}`;
      this.recordAudit({
        id: this.generateAuditId(),
        key,
        oldValue: this.inMemoryConfig[parsedKey] ?? null,
        newValue: rawValue,
        updatedBy,
        timestamp: new Date().toISOString(),
        status: 'REJECTED',
        reason: err,
        source: 'ADMIN_API',
      });
      throw new BadRequestException(err);
    }

    // Attempt schema validation
    const validation = keySchema.safeParse(rawValue);
    if (!validation.success) {
      const issues = validation.error.issues
        .map((i) => `${i.path.join('.') || key}: ${i.message}`)
        .join('; ');
      const err = `Schema validation failed for "${key}": ${issues}`;

      this.recordAudit({
        id: this.generateAuditId(),
        key,
        oldValue: this.inMemoryConfig[parsedKey] ?? null,
        newValue: rawValue,
        updatedBy,
        timestamp: new Date().toISOString(),
        status: 'REJECTED',
        reason: err,
        source: 'ADMIN_API',
      });

      throw new BadRequestException(err);
    }

    const validValue = validation.data;
    const oldValue = this.inMemoryConfig[parsedKey];

    // Persist into distributed etcd store (streaming watcher triggers reload)
    await this.watcher.put(parsedKey, JSON.stringify(validValue));

    // Update in-memory state atomically (<100ms)
    (this.inMemoryConfig as Record<string, unknown>)[parsedKey] = validValue;

    this.recordAudit({
      id: this.generateAuditId(),
      key: parsedKey,
      oldValue,
      newValue: validValue,
      updatedBy,
      timestamp: new Date().toISOString(),
      status: 'APPLIED',
      source: 'ADMIN_API',
    });

    this.logger.log(
      `Dynamic config hot-reloaded: [${parsedKey}] = ${JSON.stringify(validValue)} by ${updatedBy}`,
    );

    return {
      key: parsedKey,
      value: validValue,
      applied: true,
    };
  }

  /**
   * Internal stream change handler when etcd emits a change event.
   */
  public handleEtcdChangeEvent(event: EtcdWatchEvent): void {
    const cleanKey = event.key.replace(
      /^\/codepulse\/config\//,
      '',
    ) as DynamicConfigKey;
    const shape = DynamicConfigSchema.shape as Record<string, ZodTypeAny>;
    const keySchema = shape[cleanKey];

    if (!keySchema) {
      this.logger.warn(
        `Ignored change for unrecognized configuration key: "${event.key}"`,
      );
      return;
    }

    if (event.type === 'delete') {
      const defaultValues = DynamicConfigSchema.parse({}) as Record<
        string,
        unknown
      >;
      const defaultValue = defaultValues[cleanKey];
      const oldValue = this.inMemoryConfig[cleanKey];
      (this.inMemoryConfig as Record<string, unknown>)[cleanKey] = defaultValue;

      this.recordAudit({
        id: this.generateAuditId(),
        key: cleanKey,
        oldValue,
        newValue: defaultValue,
        updatedBy: 'etcd-watcher',
        timestamp: new Date().toISOString(),
        status: 'APPLIED',
        reason: 'Key deleted in etcd; reset to default',
        source: 'ETCD_WATCHER',
      });
      return;
    }

    try {
      const rawVal: unknown = event.value ? JSON.parse(event.value) : null;
      const parsed: unknown = keySchema.parse(rawVal);
      const oldValue = this.inMemoryConfig[cleanKey];

      (this.inMemoryConfig as Record<string, unknown>)[cleanKey] = parsed;

      this.recordAudit({
        id: this.generateAuditId(),
        key: cleanKey,
        oldValue,
        newValue: parsed,
        updatedBy: 'etcd-watcher',
        timestamp: new Date().toISOString(),
        status: 'APPLIED',
        source: 'ETCD_WATCHER',
      });

      this.logger.log(
        `etcd stream watcher hot-reloaded key: "${cleanKey}" to ${JSON.stringify(parsed)}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to apply stream update for key "${cleanKey}": ${msg}`,
      );
      this.recordAudit({
        id: this.generateAuditId(),
        key: cleanKey,
        oldValue: this.inMemoryConfig[cleanKey],
        newValue: event.value,
        updatedBy: 'etcd-watcher',
        timestamp: new Date().toISOString(),
        status: 'REJECTED',
        reason: `Validation error: ${msg}`,
        source: 'ETCD_WATCHER',
      });
    }
  }

  /**
   * Returns audit logs of all configuration adjustments.
   */
  getAuditLogs(limit = 50): AuditLogEntry[] {
    return this.auditLogs.slice(-limit).reverse();
  }

  getWatcher(): EtcdWatcher {
    return this.watcher;
  }

  private recordAudit(entry: AuditLogEntry): void {
    this.auditLogs.push(entry);
    if (this.auditLogs.length > this.maxAuditLogs) {
      this.auditLogs.shift();
    }
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}
