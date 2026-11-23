import { RamfsPoolService } from './ramfs-pool.service';

describe('RamfsPoolService', () => {
  let pool: RamfsPoolService;

  beforeEach(() => {
    pool = new RamfsPoolService();
  });

  afterEach(() => {
    pool.onModuleDestroy();
  });

  it('should provision and wipe in-memory tmpfs mount points', () => {
    const mount = pool.createEphemeralMount('mount-1', 128);
    expect(mount.tmpfsPath).toContain('mount-1');
    expect(mount.sizeBytes).toBe(128 * 1024 * 1024);

    const released = pool.wipeAndRelease('mount-1');
    expect(released).toBe(true);
  });
});
