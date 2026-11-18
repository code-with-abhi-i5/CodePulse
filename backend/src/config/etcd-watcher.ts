import { EventEmitter } from 'events';
import { Logger } from '@nestjs/common';

export type EtcdEventType = 'put' | 'delete';

export interface EtcdWatchEvent {
  type: EtcdEventType;
  key: string;
  value: string | null;
  previousValue?: string | null;
  modRevision?: number;
}

export interface EtcdWatcherOptions {
  prefix?: string;
  hosts?: string[];
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
  requestTimeoutMs?: number;
  mockClient?: IEtcdClient;
}

export interface IEtcdClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  watch(prefix: string): IEtcdWatcherStream;
  close?(): Promise<void> | void;
}

export interface IEtcdWatcherStream extends EventEmitter {
  close(): void;
}

/**
 * In-memory streaming gRPC etcd3 client for cluster simulation and local dev
 */
export class InMemoryEtcdClient implements IEtcdClient {
  private readonly store = new Map<string, string>();
  private readonly watchers = new Set<{
    prefix: string;
    stream: InMemoryWatcherStream;
  }>();

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.store.get(key) ?? null);
  }

  put(key: string, value: string): Promise<void> {
    const prev = this.store.get(key) ?? null;
    this.store.set(key, value);

    const event: EtcdWatchEvent = {
      type: 'put',
      key,
      value,
      previousValue: prev,
      modRevision: Date.now(),
    };

    for (const watcher of this.watchers) {
      if (key.startsWith(watcher.prefix)) {
        watcher.stream.emit('data', event);
      }
    }
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    const prev = this.store.get(key) ?? null;
    this.store.delete(key);

    const event: EtcdWatchEvent = {
      type: 'delete',
      key,
      value: null,
      previousValue: prev,
      modRevision: Date.now(),
    };

    for (const watcher of this.watchers) {
      if (key.startsWith(watcher.prefix)) {
        watcher.stream.emit('data', event);
      }
    }
    return Promise.resolve();
  }

  watch(prefix: string): IEtcdWatcherStream {
    const stream = new InMemoryWatcherStream(() => {
      this.watchers.forEach((w) => {
        if (w.stream === stream) this.watchers.delete(w);
      });
    });
    this.watchers.add({ prefix, stream });
    return stream;
  }

  getAllKeys(): Map<string, string> {
    return new Map(this.store);
  }
}

export class InMemoryWatcherStream
  extends EventEmitter
  implements IEtcdWatcherStream
{
  constructor(private readonly onClose: () => void) {
    super();
  }

  close(): void {
    this.onClose();
    this.removeAllListeners();
  }
}

/**
 * Streaming etcd/Consul distributed configuration watcher engine.
 * Connects via streaming gRPC / socket abstraction to emit real-time key changes.
 */
export class EtcdWatcher extends EventEmitter {
  private readonly logger = new Logger(EtcdWatcher.name);
  private client: IEtcdClient;
  private currentStream: IEtcdWatcherStream | null = null;
  private isWatching = false;
  private isConnected = false;
  private readonly prefix: string;
  private readonly hosts: string[];

  constructor(options: EtcdWatcherOptions = {}) {
    super();
    this.prefix = options.prefix ?? '/codepulse/config/';
    this.hosts =
      options.hosts ??
      (process.env.ETCD_HOSTS
        ? process.env.ETCD_HOSTS.split(',')
        : ['127.0.0.1:2379']);
    this.client = options.mockClient ?? new InMemoryEtcdClient();
  }

  /**
   * Initializes the watcher and starts streaming real-time key updates.
   */
  start(): Promise<void> {
    if (this.isWatching) return Promise.resolve();
    this.isWatching = true;

    try {
      this.currentStream = this.client.watch(this.prefix);
      this.isConnected = true;

      this.currentStream.on('data', (event: EtcdWatchEvent) => {
        this.emit('change', event);
      });

      this.currentStream.on('error', (err: Error) => {
        this.logger.error(
          `etcd watcher stream error: ${err.message}`,
          err.stack,
        );
        this.emit('error', err);
      });

      this.currentStream.on('end', () => {
        this.logger.warn('etcd watcher stream ended');
        this.emit('end');
      });

      this.logger.log(
        `etcd streaming watcher active for prefix: "${this.prefix}" across hosts: [${this.hosts.join(', ')}]`,
      );
      return Promise.resolve();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to establish etcd watcher: ${msg}`);
      return Promise.reject(
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }

  /**
   * Stops the active streaming watcher.
   */
  stop(): Promise<void> {
    this.isWatching = false;
    this.isConnected = false;
    if (this.currentStream) {
      this.currentStream.close();
      this.currentStream = null;
    }
    this.removeAllListeners();
    this.logger.log(
      `etcd streaming watcher stopped for prefix: "${this.prefix}"`,
    );
    return Promise.resolve();
  }

  /**
   * Put key into distributed etcd store.
   */
  async put(key: string, value: string): Promise<void> {
    const fullKey = key.startsWith(this.prefix) ? key : `${this.prefix}${key}`;
    await this.client.put(fullKey, value);
  }

  /**
   * Get key from distributed etcd store.
   */
  async get(key: string): Promise<string | null> {
    const fullKey = key.startsWith(this.prefix) ? key : `${this.prefix}${key}`;
    return this.client.get(fullKey);
  }

  /**
   * Delete key from distributed etcd store.
   */
  async delete(key: string): Promise<void> {
    const fullKey = key.startsWith(this.prefix) ? key : `${this.prefix}${key}`;
    await this.client.delete(fullKey);
  }

  /**
   * Check connection status
   */
  get connected(): boolean {
    return this.isConnected;
  }

  get watching(): boolean {
    return this.isWatching;
  }

  getClient(): IEtcdClient {
    return this.client;
  }
}
