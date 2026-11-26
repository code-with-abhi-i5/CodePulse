import { AutoscalerConfig, AutoscalerDecision } from '../../types/sre';

export class K8sPodAutoscalerMetrics {
  private config: AutoscalerConfig;

  constructor(customConfig?: Partial<AutoscalerConfig>) {
    this.config = {
      minReplicas: 2,
      maxReplicas: 20,
      targetBacklogPerPod: 10,
      scaleUpFactor: 1.5,
      scaleDownDampeningMinutes: 5,
      ...customConfig
    };
  }

  computeScaling(currentReplicas: number, totalBacklog: number, lastScaleDownAtMs?: number): AutoscalerDecision {
    const rawDesired = Math.ceil(totalBacklog / this.config.targetBacklogPerPod);
    let target = Math.max(this.config.minReplicas, Math.min(rawDesired, this.config.maxReplicas));

    if (target > currentReplicas) {
      const maxAllowedScaleUp = Math.ceil(currentReplicas * this.config.scaleUpFactor);
      const desiredReplicas = Math.min(target, maxAllowedScaleUp);
      return {
        currentReplicas,
        desiredReplicas,
        totalBacklog,
        action: 'scale_up',
        reason: `Backlog of ${totalBacklog} requires scaling from ${currentReplicas} to ${desiredReplicas} pods`
      };
    }

    if (target < currentReplicas) {
      if (lastScaleDownAtMs) {
        const minutesSinceLastScaleDown = (Date.now() - lastScaleDownAtMs) / 60000;
        if (minutesSinceLastScaleDown < this.config.scaleDownDampeningMinutes) {
          return {
            currentReplicas,
            desiredReplicas: currentReplicas,
            totalBacklog,
            action: 'maintain',
            reason: `Scale-down dampened: ${minutesSinceLastScaleDown.toFixed(1)}m < ${this.config.scaleDownDampeningMinutes}m stabilization window`
          };
        }
      }

      return {
        currentReplicas,
        desiredReplicas: target,
        totalBacklog,
        action: 'scale_down',
        reason: `Backlog of ${totalBacklog} allows safe downscale to ${target} pods`
      };
    }

    return {
      currentReplicas,
      desiredReplicas: currentReplicas,
      totalBacklog,
      action: 'maintain',
      reason: `Current replica count ${currentReplicas} perfectly matches backlog needs`
    };
  }
}
