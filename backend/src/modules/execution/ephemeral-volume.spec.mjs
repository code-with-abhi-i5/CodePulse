import assert from 'node:assert/strict';
import test from 'node:test';

class EphemeralVolumeService {
  constructor() {
    this.volumes = new Map();
  }

  mountEphemeralTmpfs(sandboxId, sizeMb = 64) {
    const vol = {
      sandboxId,
      mountPoint: `/mnt/ramdisk/${sandboxId}`,
      sizeMb,
      filesCount: 0,
      mountedAt: Date.now(),
      files: new Map()
    };
    this.volumes.set(sandboxId, vol);
    return { sandboxId: vol.sandboxId, mountPoint: vol.mountPoint, sizeMb: vol.sizeMb, filesCount: 0 };
  }

  writeSourceFiles(sandboxId, files) {
    const vol = this.volumes.get(sandboxId);
    if (!vol) throw new Error('Not mounted');
    for (const [f, c] of Object.entries(files)) {
      vol.files.set(f, c);
    }
    vol.filesCount = vol.files.size;
    return vol.filesCount;
  }

  wipeEphemeralVolume(sandboxId) {
    const vol = this.volumes.get(sandboxId);
    if (!vol) return false;
    vol.files.clear();
    this.volumes.delete(sandboxId);
    return true;
  }

  getVolumeMetrics() {
    return {
      activeMounts: this.volumes.size,
      totalMountedMb: Array.from(this.volumes.values()).reduce((sum, v) => sum + v.sizeMb, 0)
    };
  }
}

test('EphemeralVolumeService: mounts ramdisk tmpfs, writes files, and wipes cleanly', () => {
  const service = new EphemeralVolumeService();
  const vol = service.mountEphemeralTmpfs('sbx-99', 128);
  assert.equal(vol.sizeMb, 128);
  assert.ok(vol.mountPoint.includes('sbx-99'));

  const count = service.writeSourceFiles('sbx-99', { 'main.rs': 'fn main() {}', 'Cargo.toml': '[package]' });
  assert.equal(count, 2);

  const wiped = service.wipeEphemeralVolume('sbx-99');
  assert.equal(wiped, true);
  assert.equal(service.getVolumeMetrics().activeMounts, 0);
});
