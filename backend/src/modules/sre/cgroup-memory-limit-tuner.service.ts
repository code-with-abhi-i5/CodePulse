import { CgroupMemoryStatus, MemoryTuningDecision } from '../../types/sre';

export class CgroupMemoryLimitTuner {
  evaluateStatus(currentBytes: number, maxBytes: number): CgroupMemoryStatus {
    const utilizationPercent = Number(((currentBytes / maxBytes) * 100).toFixed(2));
    let oomRisk: 'low' | 'moderate' | 'critical' = 'low';

    if (utilizationPercent >= 90) {
      oomRisk = 'critical';
    } else if (utilizationPercent >= 75) {
      oomRisk = 'moderate';
    }

    return {
      currentBytes,
      maxBytes,
      utilizationPercent,
      oomRisk
    };
  }

  tuneLimits(status: CgroupMemoryStatus, expansionHeadroomBytes: number = 268435456): MemoryTuningDecision {
    if (status.oomRisk === 'critical') {
      return {
        adjustedLimitBytes: status.maxBytes + expansionHeadroomBytes,
        headroomAddedBytes: expansionHeadroomBytes,
        actionTaken: 'expanded'
      };
    }
    return {
      adjustedLimitBytes: status.maxBytes,
      headroomAddedBytes: 0,
      actionTaken: 'maintained'
    };
  }
}
