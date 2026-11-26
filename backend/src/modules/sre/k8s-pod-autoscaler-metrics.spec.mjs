import test from 'node:test';
import assert from 'node:assert/strict';

class K8sPodAutoscalerMetrics {
  constructor(customConfig = {}) {
    this.config = {
      minReplicas: 2,
      maxReplicas: 20,
      targetBacklogPerPod: 10,
      scaleUpFactor: 1.5,
      scaleDownDampeningMinutes: 5,
      ...customConfig
    };
  }

  computeScaling(currentReplicas, totalBacklog, lastScaleDownAtMs) {
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

test('K8sPodAutoscalerMetrics - evaluates queue backlog and calculates dampened replica targets', () => {
  const scaler = new K8sPodAutoscalerMetrics();
  const upDecision = scaler.computeScaling(2, 50);
  assert.strictEqual(upDecision.action, 'scale_up');
  assert.strictEqual(upDecision.desiredReplicas, 3);

  const dampened = scaler.computeScaling(6, 10, Date.now() - 60000);
  assert.strictEqual(dampened.action, 'maintain');

  const downDecision = scaler.computeScaling(6, 10, Date.now() - 360000);
  assert.strictEqual(downDecision.action, 'scale_down');
  assert.strictEqual(downDecision.desiredReplicas, 2);
});
