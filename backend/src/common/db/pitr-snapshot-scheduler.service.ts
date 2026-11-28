import { PitrSnapshotConfig, PitrValidationResult } from '../../types/db';

export class PitrSnapshotSchedulerService {
  constructor(private readonly config: PitrSnapshotConfig) {}

  public calculateNextSnapshotTime(lastSnapshotTimestamp: number, now: number = Date.now()): number {
    const intervalMs = this.config.snapshotIntervalMinutes * 60 * 1000;
    const nextTime = lastSnapshotTimestamp + intervalMs;
    return nextTime <= now ? now : nextTime;
  }

  public validateRecoveryTarget(
    targetTimestamp: number,
    baseBackupTimestamp: number,
    availableSegments: string[]
  ): PitrValidationResult {
    const missingSegments: string[] = [];
    if (targetTimestamp < baseBackupTimestamp) {
      return {
        isValid: false,
        baseBackupTimestamp,
        targetRecoveryTime: targetTimestamp,
        availableWalRange: { start: availableSegments[0] || '', end: availableSegments[availableSegments.length - 1] || '' },
        missingWalSegments: ['Target timestamp is older than base backup timestamp']
      };
    }

    if (availableSegments.length === 0) {
      missingSegments.push('No WAL archive segments found');
    }

    const isValid = missingSegments.length === 0 && targetTimestamp >= baseBackupTimestamp;
    return {
      isValid,
      baseBackupTimestamp,
      targetRecoveryTime: targetTimestamp,
      availableWalRange: {
        start: availableSegments[0] || '',
        end: availableSegments[availableSegments.length - 1] || ''
      },
      missingWalSegments: missingSegments
    };
  }

  public shouldPruneSnapshot(snapshotTimestamp: number, now: number = Date.now()): boolean {
    const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
    return (now - snapshotTimestamp) > retentionMs;
  }
}
