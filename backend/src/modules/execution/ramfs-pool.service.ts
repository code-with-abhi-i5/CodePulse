import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { RamfsMountProfile } from './ramfs-pool.types';

@Injectable()
export class RamfsPoolService implements OnModuleDestroy {
  private readonly logger = new Logger(RamfsPoolService.name);
  private readonly mounts = new Map<string, RamfsMountProfile>();

  public onModuleDestroy(): void {
    this.mounts.clear();
  }

  public createEphemeralMount(mountId: string, sizeMb = 64): RamfsMountProfile {
    const profile: RamfsMountProfile = {
      mountId,
      tmpfsPath: `/dev/shm/codepulse/${mountId}`,
      sizeBytes: sizeMb * 1024 * 1024,
      mountedAt: Date.now(),
      wiped: false,
    };
    this.mounts.set(mountId, profile);
    return profile;
  }

  public wipeAndRelease(mountId: string): boolean {
    const mount = this.mounts.get(mountId);
    if (mount) {
      mount.wiped = true;
      this.mounts.delete(mountId);
      return true;
    }
    return false;
  }
}
