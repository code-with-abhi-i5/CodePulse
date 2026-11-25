import { Injectable, Logger } from '@nestjs/common';

export interface VolumeConfig {
  sandboxId: string;
  mountPoint: string;
  sizeMb: number;
  filesCount: number;
  mountedAt: number;
}

@Injectable()
export class EphemeralVolumeService {
  private readonly logger = new Logger(EphemeralVolumeService.name);
  private volumes: Map<string, VolumeConfig & { files: Map<string, string> }> = new Map();

  public mountEphemeralTmpfs(sandboxId: string, sizeMb = 64): VolumeConfig {
    const vol = {
      sandboxId,
      mountPoint: `/mnt/ramdisk/${sandboxId}`,
      sizeMb,
      filesCount: 0,
      mountedAt: Date.now(),
      files: new Map<string, string>()
    };
    this.volumes.set(sandboxId, vol);
    return {
      sandboxId: vol.sandboxId,
      mountPoint: vol.mountPoint,
      sizeMb: vol.sizeMb,
      filesCount: vol.filesCount,
      mountedAt: vol.mountedAt
    };
  }

  public writeSourceFiles(sandboxId: string, files: Record<string, string>): number {
    const vol = this.volumes.get(sandboxId);
    if (!vol) throw new Error(`Volume ${sandboxId} not mounted`);
    for (const [filename, content] of Object.entries(files)) {
      vol.files.set(filename, content);
    }
    vol.filesCount = vol.files.size;
    return vol.filesCount;
  }

  public wipeEphemeralVolume(sandboxId: string): boolean {
    const vol = this.volumes.get(sandboxId);
    if (!vol) return false;
    vol.files.clear();
    this.volumes.delete(sandboxId);
    return true;
  }

  public getVolumeMetrics() {
    return {
      activeMounts: this.volumes.size,
      totalMountedMb: Array.from(this.volumes.values()).reduce((sum, v) => sum + v.sizeMb, 0)
    };
  }
}
