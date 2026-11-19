import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EtcdWatcherService } from './etcd-watcher.service';
import {
  DynamicConfigKey,
  ConfigChangeEvent,
  saveFallbackCache,
} from './configuration';
import { EtcdWatcher, InMemoryEtcdClient } from './etcd-watcher';

describe('EtcdWatcherService', () => {
  let service: EtcdWatcherService;
  let mockClient: InMemoryEtcdClient;
  let watcher: EtcdWatcher;
  let testCachePath: string;

  beforeEach(async () => {
    testCachePath = path.join(
      os.tmpdir(),
      `test-config-cache-${Date.now()}-${Math.random().toString(36).substring(2)}.json`,
    );

    mockClient = new InMemoryEtcdClient();
    watcher = new EtcdWatcher({
      prefix: '/codepulse/config/',
      mockClient,
    });

    service = new EtcdWatcherService({
      prefix: '/codepulse/config/',
      mockClient,
      fallbackCachePath: testCachePath,
      enableFallbackCache: true,
    });

    await service.start(watcher);
  });

  afterEach(async () => {
    await service.stop();
    try {
      if (fs.existsSync(testCachePath)) {
        fs.unlinkSync(testCachePath);
      }
    } catch {
      // Ignore cleanup error
    }
  });

  describe('Initialization & Fallback Cache', () => {
    it('should initialize with schema default values', () => {
      const all = service.getAll();
      expect(all.FEATURE_BATTLES_ENABLED).toBe(true);
      expect(all.MAINTENANCE_MODE).toBe(false);
      expect(all.ELO_K_FACTOR).toBe(32);
      expect(all.MAX_CONCURRENT_MATCHES).toBe(50);
      expect(all.RATE_LIMIT_QUOTA_DEFAULT).toBe(60);
      expect(all.AI_MODEL_ENDPOINT).toBe('https://api.openai.com/v1');
    });

    it('should hydrate from local file fallback cache on boot', async () => {
      const customCachePath = path.join(
        os.tmpdir(),
        `custom-cache-${Date.now()}.json`,
      );
      saveFallbackCache(
        { ELO_K_FACTOR: 50, MAINTENANCE_MODE: true },
        customCachePath,
      );

      const bootService = new EtcdWatcherService({
        fallbackCachePath: customCachePath,
        enableFallbackCache: true,
        mockClient: new InMemoryEtcdClient(),
      });
      await bootService.start();

      expect(bootService.get('ELO_K_FACTOR')).toBe(50);
      expect(bootService.get('MAINTENANCE_MODE')).toBe(true);
      // Other un-overridden defaults stay intact
      expect(bootService.get('FEATURE_BATTLES_ENABLED')).toBe(true);

      await bootService.stop();
      if (fs.existsSync(customCachePath)) fs.unlinkSync(customCachePath);
    });

    it('should boot reliably even if etcd watcher start fails (cluster down)', async () => {
      const brokenWatcher = {
        start: jest
          .fn()
          .mockRejectedValue(
            new Error('etcd cluster connection refused: 2379'),
          ),
        stop: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        connected: false,
        watching: false,
      } as unknown as EtcdWatcher;

      const resilientService = new EtcdWatcherService({
        enableFallbackCache: false,
      });

      // Does not throw, degrades gracefully to local configuration
      await expect(
        resilientService.start(brokenWatcher),
      ).resolves.not.toThrow();
      expect(resilientService.get('ELO_K_FACTOR')).toBe(32);

      await resilientService.stop();
    });
  });

  describe('Configuration Read & Write', () => {
    it('should get configuration parameter by key', () => {
      expect(service.get('ELO_K_FACTOR')).toBe(32);
      expect(service.get('FEATURE_BATTLES_ENABLED')).toBe(true);
    });

    it('should throw NotFoundException for undefined keys', () => {
      expect(() => service.get('NON_EXISTENT_KEY' as DynamicConfigKey)).toThrow(
        NotFoundException,
      );
    });

    it('should update valid config parameter within 50ms and write to cache', async () => {
      const start = Date.now();
      const res = await service.set('ELO_K_FACTOR', 48, 'admin-operator');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
      expect(res.applied).toBe(true);
      expect(res.value).toBe(48);
      expect(service.get('ELO_K_FACTOR')).toBe(48);

      // Verify written to fallback cache on disk
      expect(fs.existsSync(testCachePath)).toBe(true);
      const fileData = JSON.parse(fs.readFileSync(testCachePath, 'utf8'));
      expect(fileData.ELO_K_FACTOR).toBe(48);

      // Verify audit logs
      const audits = service.getAuditLogs();
      expect(audits[0].key).toBe('ELO_K_FACTOR');
      expect(audits[0].oldValue).toBe(32);
      expect(audits[0].newValue).toBe(48);
      expect(audits[0].status).toBe('APPLIED');
    });

    it('should reject invalid schema types and throw BadRequestException', async () => {
      // ELO_K_FACTOR expects number between 8 and 64
      await expect(
        service.set('ELO_K_FACTOR', 'not-a-number' as any, 'operator'),
      ).rejects.toThrow(BadRequestException);

      // Out of bounds: max is 64
      await expect(service.set('ELO_K_FACTOR', 99, 'operator')).rejects.toThrow(
        BadRequestException,
      );

      // Invalid URL for AI_MODEL_ENDPOINT
      await expect(
        service.set('AI_MODEL_ENDPOINT', 'invalid-url', 'operator'),
      ).rejects.toThrow(BadRequestException);

      // Audit logs must capture rejection
      const audits = service.getAuditLogs();
      expect(audits[0].status).toBe('REJECTED');
    });

    it('should reject unknown configuration parameters', async () => {
      await expect(
        service.set('UNKNOWN_KEY' as any, 123, 'operator'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Event Dispatching & Subscriptions', () => {
    it('should publish typed ConfigChangeEvent through onConfigChange and onKeyChange', async () => {
      const globalChanges: ConfigChangeEvent[] = [];
      const keyChanges: ConfigChangeEvent[] = [];

      const unsubscribeGlobal = service.onConfigChange((event) => {
        globalChanges.push(event);
      });

      const unsubscribeKey = service.onKeyChange(
        'MAX_CONCURRENT_MATCHES',
        (event) => {
          keyChanges.push(event);
        },
      );

      await service.set('MAX_CONCURRENT_MATCHES', 150, 'test-runner');

      expect(globalChanges.length).toBe(1);
      expect(globalChanges[0].key).toBe('MAX_CONCURRENT_MATCHES');
      expect(globalChanges[0].previousValue).toBe(50);
      expect(globalChanges[0].newValue).toBe(150);

      expect(keyChanges.length).toBe(1);
      expect(keyChanges[0].newValue).toBe(150);

      unsubscribeGlobal();
      unsubscribeKey();

      await service.set('MAX_CONCURRENT_MATCHES', 200, 'test-runner');
      expect(globalChanges.length).toBe(1);
      expect(keyChanges.length).toBe(1);
    });
  });

  describe('Watch Streams & Runtime Hot-Reloading', () => {
    it('should automatically hot-reload in-memory state when etcd stream emits key change (<50ms)', async () => {
      const changes: ConfigChangeEvent[] = [];
      service.onConfigChange((e) => changes.push(e));

      const start = Date.now();
      await watcher.put('RATE_LIMIT_QUOTA_DEFAULT', JSON.stringify(120));
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
      expect(service.get('RATE_LIMIT_QUOTA_DEFAULT')).toBe(120);
      expect(changes.length).toBe(1);
      expect(changes[0].key).toBe('RATE_LIMIT_QUOTA_DEFAULT');
      expect(changes[0].newValue).toBe(120);
      expect(changes[0].source).toBe('etcd');

      const audits = service.getAuditLogs();
      expect(audits[0].source).toBe('ETCD_WATCHER');
      expect(audits[0].newValue).toBe(120);
    });

    it('should reject malformed updates received via etcd watch stream without crashing or altering state', async () => {
      const validationErrors: any[] = [];
      service.on('validation_error', (err) => validationErrors.push(err));

      // Put invalid negative number for RATE_LIMIT_QUOTA_DEFAULT (min is 10)
      await watcher.put('RATE_LIMIT_QUOTA_DEFAULT', JSON.stringify(-5));

      // State remains unchanged at default (60)
      expect(service.get('RATE_LIMIT_QUOTA_DEFAULT')).toBe(60);
      expect(validationErrors.length).toBe(1);
      expect(validationErrors[0].key).toBe('RATE_LIMIT_QUOTA_DEFAULT');

      const audits = service.getAuditLogs();
      expect(audits[0].status).toBe('REJECTED');
    });

    it('should reset to default when key is deleted in etcd stream', async () => {
      await service.set('MAINTENANCE_MODE', true);
      expect(service.get('MAINTENANCE_MODE')).toBe(true);

      await watcher.delete('MAINTENANCE_MODE');
      expect(service.get('MAINTENANCE_MODE')).toBe(false);
    });

    it('should handle stream reconnect events gracefully without dropping service', async () => {
      const spyStart = jest.spyOn(watcher, 'start');

      // Simulate stream error
      watcher.emit('error', new Error('gRPC connection reset by peer'));

      // Reconnect timer is scheduled and doesn't throw
      expect(service.isWatching).toBe(true);
      spyStart.mockRestore();
    });
  });
});
