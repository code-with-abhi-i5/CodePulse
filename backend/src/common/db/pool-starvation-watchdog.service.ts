import { PoolScalingDecision } from '../../types/db';

export class PoolStarvationWatchdogService {
  constructor(
    private readonly minPoolLimit: number = 10,
    private readonly maxPoolLimit: number = 100,
    private readonly scaleStep: number = 10
  ) {}

  public evaluatePoolStatus(
    currentActive: number,
    currentMax: number,
    queueLength: number
  ): PoolScalingDecision {
    const saturation = currentMax > 0 ? (currentActive / currentMax) : 0;

    if (saturation >= 0.85 || queueLength > 5) {
      if (currentMax < this.maxPoolLimit) {
        const recommendedMax = Math.min(currentMax + this.scaleStep, this.maxPoolLimit);
        return {
          currentActive,
          currentMax,
          queueLength,
          recommendedMax,
          action: 'SCALE_UP',
          reason: `Pool saturation ${(saturation * 100).toFixed(1)}% or queue length ${queueLength} demands scaling up`
        };
      }
    } else if (saturation < 0.25 && queueLength === 0 && currentMax > this.minPoolLimit) {
      const recommendedMax = Math.max(currentMax - this.scaleStep, this.minPoolLimit);
      return {
        currentActive,
        currentMax,
        queueLength,
        recommendedMax,
        action: 'SCALE_DOWN',
        reason: 'Pool utilization under 25% with zero waiting queue'
      };
    }

    return {
      currentActive,
      currentMax,
      queueLength,
      recommendedMax: currentMax,
      action: 'NO_OP',
      reason: 'Pool operating within optimal saturation parameters'
    };
  }
}
