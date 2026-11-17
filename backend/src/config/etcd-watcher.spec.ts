import {
  EtcdWatcher,
  InMemoryEtcdClient,
  EtcdWatchEvent,
} from './etcd-watcher';

describe('EtcdWatcher', () => {
  let mockClient: InMemoryEtcdClient;
  let watcher: EtcdWatcher;

  beforeEach(() => {
    mockClient = new InMemoryEtcdClient();
    watcher = new EtcdWatcher({
      prefix: '/codepulse/config/',
      mockClient,
    });
  });

  afterEach(async () => {
    await watcher.stop();
  });

  it('should initialize and connect watcher stream', async () => {
    expect(watcher.watching).toBe(false);
    await watcher.start();
    expect(watcher.watching).toBe(true);
    expect(watcher.connected).toBe(true);
  });

  it('should emit change events when keys under prefix are updated', async () => {
    await watcher.start();
    const changes: EtcdWatchEvent[] = [];

    watcher.on('change', (event: EtcdWatchEvent) => {
      changes.push(event);
    });

    await watcher.put('FEATURE_BATTLES_ENABLED', 'true');

    expect(changes.length).toBe(1);
    expect(changes[0].type).toBe('put');
    expect(changes[0].key).toBe('/codepulse/config/FEATURE_BATTLES_ENABLED');
    expect(changes[0].value).toBe('true');
  });

  it('should emit delete events when keys are removed', async () => {
    await watcher.start();
    await watcher.put('MAINTENANCE_MODE', 'true');

    const changes: EtcdWatchEvent[] = [];
    watcher.on('change', (event: EtcdWatchEvent) => {
      changes.push(event);
    });

    await watcher.delete('MAINTENANCE_MODE');

    expect(changes.length).toBe(1);
    expect(changes[0].type).toBe('delete');
    expect(changes[0].key).toBe('/codepulse/config/MAINTENANCE_MODE');
    expect(changes[0].value).toBeNull();
  });

  it('should ignore changes outside of prefix', async () => {
    await watcher.start();
    const changes: EtcdWatchEvent[] = [];

    watcher.on('change', (event: EtcdWatchEvent) => {
      changes.push(event);
    });

    await mockClient.put('/unrelated/prefix/key', 'val');
    expect(changes.length).toBe(0);
  });

  it('should cleanly stop watching and remove listeners', async () => {
    await watcher.start();
    expect(watcher.watching).toBe(true);

    await watcher.stop();
    expect(watcher.watching).toBe(false);
    expect(watcher.connected).toBe(false);
  });
});
