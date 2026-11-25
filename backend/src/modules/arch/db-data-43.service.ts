/**
 * Architecture Service: Database Sequence Overflow Watchdog
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-43]
 */

export interface SequenceInfo {
  sequenceName: string;
  currentValue: number;
  maxValue: number;
}

export class DatabaseSequenceOverflowWatchdogService {
  private warningThresholdRatio: number;

  constructor(warningThresholdRatio: number = 0.8) { // 80% capacity warning
    this.warningThresholdRatio = warningThresholdRatio;
  }

  public checkSequences(sequences: SequenceInfo[]): Array<{
    sequenceName: string;
    capacityUsed: number;
    isCritical: boolean;
    recommendation: string;
  }> {
    const alerts: Array<{ sequenceName: string; capacityUsed: number; isCritical: boolean; recommendation: string }> = [];

    for (const seq of sequences) {
      if (seq.maxValue <= 0) continue;
      const ratio = seq.currentValue / seq.maxValue;

      if (ratio >= this.warningThresholdRatio) {
        alerts.push({
          sequenceName: seq.sequenceName,
          capacityUsed: Number((ratio * 100).toFixed(1)),
          isCritical: ratio >= 0.95,
          recommendation: `Sequence '${seq.sequenceName}' is at ${(ratio * 100).toFixed(1)}% of maximum value. Migrate primary key column to BIGINT.`
        });
      }
    }

    return alerts.sort((a, b) => b.capacityUsed - a.capacityUsed);
  }
}
