import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  DynamicConfigService,
  DynamicConfigKey,
} from './dynamic-config.service';
import { EtcdWatcher, InMemoryEtcdClient } from './etcd-watcher';

describe('DynamicConfigService', () => {
  let service: DynamicConfigService;
  let mockClient: InMemoryEtcdClient;
  let watcher: EtcdWatcher;

  beforeEach(async () => {
    mockClient = new InMemoryEtcdClient();
    watcher = new EtcdWatcher({
      prefix: '/codepulse/config/',
      mockClient,
    });
    service = new DynamicConfigService();
    await service.start(watcher);
  });

  afterEach(async () => {
    await service.stop();
  });

  it('should initialize with schema default values', () => {
    const all = service.getAll();
    expect(all.FEATURE_BATTLES_ENABLED).toBe(true);
    expect(all.MAINTENANCE_MODE).toBe(false);
    expect(all.ELO_K_FACTOR).toBe(32);
    expect(all.MAX_CONCURRENT_MATCHES).toBe(50);
  });

  it('should get individual config values', () => {
    expect(service.get('ELO_K_FACTOR')).toBe(32);
    expect(service.get('FEATURE_BATTLES_ENABLED')).toBe(true);
  });

  it('should throw NotFoundException when getting invalid key', () => {
    expect(() => service.get('INVALID_KEY' as DynamicConfigKey)).toThrow(
      NotFoundException,
    );
  });

  it('should update valid config parameter and hot-reload in memory within 100ms', async () => {
    const start = Date.now();
    const res = await service.set('ELO_K_FACTOR', 48, 'admin-tester');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
    expect(res.applied).toBe(true);
    expect(res.value).toBe(48);
    expect(service.get('ELO_K_FACTOR')).toBe(48);

    // Verify audit log
    const audits = service.getAuditLogs();
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits[0].key).toBe('ELO_K_FACTOR');
    expect(audits[0].oldValue).toBe(32);
    expect(audits[0].newValue).toBe(48);
    expect(audits[0].updatedBy).toBe('admin-tester');
    expect(audits[0].status).toBe('APPLIED');
  });

  it('should reject invalid schema types and throw BadRequestException', async () => {
    // ELO_K_FACTOR expects number between 8 and 64
    await expect(
      service.set('ELO_K_FACTOR', 'not-a-number', 'attacker'),
    ).rejects.toThrow(BadRequestException);

    // ELO_K_FACTOR out of range
    await expect(service.set('ELO_K_FACTOR', 100, 'attacker')).rejects.toThrow(
      BadRequestException,
    );

    // Verify audit log captured the rejected attempt
    const audits = service.getAuditLogs();
    expect(audits[0].status).toBe('REJECTED');
    expect(audits[0].key).toBe('ELO_K_FACTOR');
  });

  it('should reject unknown configuration parameters', async () => {
    await expect(
      service.set('UNKNOWN_KEY_NAME', true, 'admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should automatically hot-reload in-memory state when etcd stream watcher emits change', async () => {
    // Simulate another clustered backend instance changing config via etcd
    await watcher.put('MAX_CONCURRENT_MATCHES', JSON.stringify(120));

    expect(service.get('MAX_CONCURRENT_MATCHES')).toBe(120);

    const audits = service.getAuditLogs();
    expect(audits[0].source).toBe('ETCD_WATCHER');
    expect(audits[0].newValue).toBe(120);
  });

  it('should reset to schema default when key is deleted from etcd', async () => {
    await service.set('MAINTENANCE_MODE', true);
    expect(service.get('MAINTENANCE_MODE')).toBe(true);

    await watcher.delete('MAINTENANCE_MODE');
    expect(service.get('MAINTENANCE_MODE')).toBe(false);
  });
});
