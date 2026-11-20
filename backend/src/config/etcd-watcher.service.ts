import {
  Injectable,
  Optional,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import { ZodTypeAny } from 'zod';
import {
  DynamicConfigSchema,
  DynamicConfigValues,
  DynamicConfigKey,
  ConfigChangeEvent,
  AuditLogEntry,
  loadFallbackCache,
  saveFallbackCache,
  DEFAULT_FALLBACK_CACHE_PATH,
} from './configuration';
import {
  EtcdWatcher,
  EtcdWatchEvent,
  EtcdWatcherOptions,
  IEtcdClient,
} from './etcd-watcher';

export interface EtcdWatcherServiceOptions extends EtcdWatcherOptions {
  fallbackCachePath?: string;
  enableFallbackCache?: boolean;
}

@Injectable()
export class EtcdWatcherService
  extends EventEmitter
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(EtcdWatcherService.name);
  private watcher: EtcdWatcher;
  private inMemoryConfig: DynamicConfigValues;
  private readonly auditLogs: AuditLogEntry[] = [];
  private readonly maxAuditLogs = 200;
  private readonly fallbackCachePath: string;
  private readonly enableFallbackCache: boolean;
  private isRunning = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(@Optional() options?: EtcdWatcherServiceOptions) {
    super();
    const opts = options ?? {};
    this.fallbackCachePath =
      opts.fallbackCachePath ?? DEFAULT_FALLBACK_CACHE_PATH;
    this.enableFallbackCache = opts.enableFallbackCache ?? true;

    // 1. Initialize base configuration from schema defaults
    this.inMemoryConfig = DynamicConfigSchema.parse({});

    // 2. Hydrate from local file fallback cache if available
    if (this.enableFallbackCache) {
      this.hydrateFromFallbackCache();
    }

    // 3. Instantiate etcd distributed stream watcher
    this.watcher = new EtcdWatcher({
      prefix: opts.prefix ?? '/codepulse/config/',
      hosts: opts.hosts,
      mockClient: opts.mockClient,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  /**
   * Initializes the distributed dynamic config watcher.
   * Catches network or cluster failures to ensure the service boots reliably
   * using the local fallback cache even if etcd is initially unreachable.
   */
  async start(customWatcher?: EtcdWatcher): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    if (customWatcher) {
      this.watcher = customWatcher;
    }

    this.attachWatcherListeners();

    try {
      await this.watcher.start();
      this.logger.log(
        'EtcdWatcherService initialized with active continuous watch stream',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Initial etcd cluster connection failed: ${msg}. Running on local file fallback cache.`,
      );
      this.scheduleReconnect();
    }
  }

  /**
   * Stops the active streaming watcher and cleans up timers.
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    await this.watcher.stop();
    this.removeAllListeners();
    this.logger.log('EtcdWatcherService stopped cleanly');
  }

  /**
   * Returns snapshot of entire in-memory configuration atomically.
   */
  getAll(): DynamicConfigValues {
    return { ...this.inMemoryConfig };
  }

  /**
   * Retrieves single configuration parameter by key.
   */
  get<K extends DynamicConfigKey>(key: K): DynamicConfigValues[K] {
    if (!(key in this.inMemoryConfig)) {
      throw new NotFoundException(
        `Configuration parameter "${String(key)}" is not defined`,
      );
    }
    return this.inMemoryConfig[key];
  }

  /**
   * Atomically updates a configuration value, validates against Zod schema,
   * propagates to etcd, and persists to local fallback cache.
   */
  async set<K extends DynamicConfigKey>(
    key: K,
    rawValue: unknown,
    updatedBy = 'system',
  ): Promise<{ key: string; value: unknown; applied: boolean }> {
    const shape = DynamicConfigSchema.shape as Record<string, ZodTypeAny>;
    const keySchema = shape[key];

    if (!keySchema) {
      const err = `Unknown configuration parameter "${key}". Available keys: ${Object.keys(shape).join(', ')}`;
      this.recordAudit({
        id: this.generateAuditId(),
        key,
        oldValue: (this.inMemoryConfig as Record<string, unknown>)[key] ?? null,
        newValue: rawValue,
        updatedBy,
        timestamp: new Date().toISOString(),
        status: 'REJECTED',
        reason: err,
        source: 'ADMIN_API',
      });
      throw new BadRequestException(err);
    }

    const validation = keySchema.safeParse(rawValue);
    if (!validation.success) {
      const issues = validation.error.issues
        .map((i: any) => `${i.path.join('.') || key}: ${i.message}`)
        .join('; ');
      const err = `Schema validation failed for "${key}": ${issues}`;

      this.recordAudit({
        id: this.generateAuditId(),
        key,
        oldValue: (this.inMemoryConfig as Record<string, unknown>)[key] ?? null,
        newValue: rawValue,
        updatedBy,
        timestamp: new Date().toISOString(),
        status: 'REJECTED',
        reason: err,
        source: 'ADMIN_API',
      });

      this.logger.error(
        `[EtcdWatcherService] Rejected malformed configuration: ${err}`,
      );
      throw new BadRequestException(err);
    }

    const validValue = validation.data;
    const oldValue = (this.inMemoryConfig as Record<string, unknown>)[key];

    // Update in-memory cache first (<50ms latency)
    (this.inMemoryConfig as Record<string, unknown>)[key] = validValue;

    // Propagate into distributed etcd store (streaming watcher deduplicates local update)
    await this.watcher.put(key, JSON.stringify(validValue));

    // Persist to local fallback cache
    if (this.enableFallbackCache) {
      saveFallbackCache(this.inMemoryConfig, this.fallbackCachePath);
    }

    // Publish typed ConfigChangeEvent
    const event: ConfigChangeEvent = {
      key,
      previousValue: oldValue,
      newValue: validValue,
      timestamp: Date.now(),
      source: 'manual',
    };
    this.emit('change', event);
    this.emit('configChange', event);
    this.emit(`change:${key}`, event);

    this.recordAudit({
      id: this.generateAuditId(),
      key,
      oldValue,
      newValue: validValue,
      updatedBy,
      timestamp: new Date().toISOString(),
      status: 'APPLIED',
      source: 'ADMIN_API',
    });

    this.logger.log(
      `Configuration parameter "${key}" hot-reloaded to ${JSON.stringify(validValue)} by ${updatedBy}`,
    );

    return {
      key,
      value: validValue,
      applied: true,
    };
  }

  /**
   * Internal stream change handler for incoming etcd watch events.
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

      if (this.enableFallbackCache) {
        saveFallbackCache(this.inMemoryConfig, this.fallbackCachePath);
      }

      const changeEvent: ConfigChangeEvent = {
        key: cleanKey,
        previousValue: oldValue,
        newValue: defaultValue,
        timestamp: Date.now(),
        source: 'etcd',
      };
      this.emit('change', changeEvent);
      this.emit('configChange', changeEvent);
      this.emit(`change:${cleanKey}`, changeEvent);

      this.recordAudit({
        id: this.generateAuditId(),
        key: cleanKey,
        oldValue,
        newValue: defaultValue,
        updatedBy: 'etcd-watcher',
        timestamp: new Date().toISOString(),
        status: 'APPLIED',
        reason: 'Key deleted in etcd; reset to schema default',
        source: 'ETCD_WATCHER',
      });
      return;
    }

    try {
      const rawVal: unknown = event.value ? JSON.parse(event.value) : null;
      const parsed: unknown = keySchema.parse(rawVal);
      const oldValue = this.inMemoryConfig[cleanKey];

      // Deduplicate if already applied locally by set()
      if (JSON.stringify(oldValue) === JSON.stringify(parsed)) {
        return;
      }

      // Update in-memory configuration atomically (<50ms)
      (this.inMemoryConfig as Record<string, unknown>)[cleanKey] = parsed;

      // Persist to local fallback cache
      if (this.enableFallbackCache) {
        saveFallbackCache(this.inMemoryConfig, this.fallbackCachePath);
      }

      const changeEvent: ConfigChangeEvent = {
        key: cleanKey,
        previousValue: oldValue,
        newValue: parsed,
        timestamp: Date.now(),
        source: 'etcd',
      };
      this.emit('change', changeEvent);
      this.emit('configChange', changeEvent);
      this.emit(`change:${cleanKey}`, changeEvent);

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
        `Dynamic config hot-reloaded: [${cleanKey}] = ${JSON.stringify(parsed)}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[EtcdWatcherService] Rejected malformed configuration for "${cleanKey}": ${msg}`,
      );

      this.emit('validation_error', {
        key: cleanKey,
        raw: event.value,
        error: msg,
      });

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
   * Subscribes to global configuration change events.
   */
  onConfigChange(handler: (event: ConfigChangeEvent) => void): () => void {
    this.on('configChange', handler);
    return () => this.off('configChange', handler);
  }

  /**
   * Subscribes to changes for a specific configuration key.
   */
  onKeyChange<K extends DynamicConfigKey>(
    key: K,
    handler: (event: ConfigChangeEvent) => void,
  ): () => void {
    const eventName = `change:${key}`;
    this.on(eventName, handler);
    return () => this.off(eventName, handler);
  }

  getAuditLogs(limit = 50): AuditLogEntry[] {
    return this.auditLogs.slice(-limit).reverse();
  }

  getWatcher(): EtcdWatcher {
    return this.watcher;
  }

  get isConnected(): boolean {
    return this.watcher.connected;
  }

  get isWatching(): boolean {
    return this.watcher.watching;
  }

  private attachWatcherListeners(): void {
    this.watcher.on('change', (event: EtcdWatchEvent) => {
      this.handleEtcdChangeEvent(event);
    });

    this.watcher.on('error', (err: Error) => {
      this.logger.warn(`Watcher stream error: ${err.message}. Reconnecting...`);
      this.scheduleReconnect();
    });

    this.watcher.on('end', () => {
      this.logger.warn('Watcher stream ended. Scheduling reconnect...');
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (!this.isRunning || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (!this.isRunning) return;
      try {
        await this.watcher.start();
        this.logger.log('Watcher stream successfully reconnected');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Reconnect failed: ${msg}. Retrying in 2s...`);
        this.scheduleReconnect();
      }
    }, 2000);
  }

  private hydrateFromFallbackCache(): void {
    const cached = loadFallbackCache(this.fallbackCachePath);
    if (Object.keys(cached).length > 0) {
      this.inMemoryConfig = {
        ...this.inMemoryConfig,
        ...cached,
      };
      this.logger.log(
        `Hydrated ${Object.keys(cached).length} configuration parameters from fallback cache`,
      );
      this.recordAudit({
        id: this.generateAuditId(),
        key: '*',
        oldValue: null,
        newValue: cached,
        updatedBy: 'system',
        timestamp: new Date().toISOString(),
        status: 'APPLIED',
        reason: 'Loaded from local file fallback cache',
        source: 'FALLBACK_CACHE',
      });
    }
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
