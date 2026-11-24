import { Injectable, Logger } from '@nestjs/common';
import { QueueVelocityProbeService, VelocityMetrics } from './queue-velocity-probe.service';

export interface AutoscalingPolicy {
  minReplicas: number;
  maxReplicas: number;
  targetCpuUtilizationPct: number;
  targetMemoryUtilizationPct: number;
  drainCapacityPerPodPerSec: number;
  scaleUpCooldownMs: number;
  scaleDownCooldownMs: number;
  maxScaleDownStepPct: number; // e.g. 20% max reduction in single step
}

export interface ResourceMetrics {
  cpuUtilizationPct: number;
  memoryUtilizationPct: number;
  queueDepth: number;
  drainRatePerSec?: number;
}

export interface ScalingEvaluationResult {
  currentReplicas: number;
  desiredReplicas: number;
  action: 'SCALE_UP' | 'SCALE_DOWN' | 'NO_OP';
  reason: string;
  contributingFactor: 'CPU' | 'MEMORY' | 'QUEUE_VELOCITY' | 'MIN_BOUND' | 'MAX_BOUND' | 'STABILIZED';
  cpuRecommendedReplicas: number;
  memRecommendedReplicas: number;
  queueRecommendedReplicas: number;
  velocityMetrics: VelocityMetrics;
  evaluatedAt: Date;
}

export interface ScalingHistoryEntry {
  timestamp: Date;
  previousReplicas: number;
  newReplicas: number;
  action: 'SCALE_UP' | 'SCALE_DOWN';
  reason: string;
  contributingFactor: string;
}

@Injectable()
export class CompositeAutoscalerService {
  private readonly logger = new Logger(CompositeAutoscalerService.name);

  private currentReplicas = 2;
  private lastScalingActionTime = 0;
  private lastActionType: 'SCALE_UP' | 'SCALE_DOWN' | null = null;
  private readonly scalingHistory: ScalingHistoryEntry[] = [];
  private readonly maxHistoryLength = 50;

  private policy: AutoscalingPolicy = {
    minReplicas: 2,
    maxReplicas: 50,
    targetCpuUtilizationPct: 70,
    targetMemoryUtilizationPct: 75,
    drainCapacityPerPodPerSec: 25,
    scaleUpCooldownMs: 30000, // 30s fast scale-up
    scaleDownCooldownMs: 300000, // 5m stabilization window
    maxScaleDownStepPct: 20,
  };

  constructor(private readonly queueProbe: QueueVelocityProbeService) {}

  public getPolicy(): AutoscalingPolicy {
    return { ...this.policy };
  }

  public updatePolicy(newPolicy: Partial<AutoscalingPolicy>): AutoscalingPolicy {
    this.policy = { ...this.policy, ...newPolicy };
    this.logger.log(`Autoscaling policy updated: ${JSON.stringify(this.policy)}`);
    return this.getPolicy();
  }

  public getCurrentReplicas(): number {
    return this.currentReplicas;
  }

  public setInitialReplicas(count: number): void {
    this.currentReplicas = Math.min(Math.max(count, this.policy.minReplicas), this.policy.maxReplicas);
  }

  /**
   * Evaluates system metrics across CPU, Memory, and Queue velocity
   * to determine the optimal composite replica count.
   */
  public evaluateMetrics(metrics: ResourceMetrics, now = Date.now()): ScalingEvaluationResult {
    const velocity = this.queueProbe.recordSample(
      metrics.queueDepth,
      metrics.drainRatePerSec ?? this.currentReplicas * this.policy.drainCapacityPerPodPerSec,
      now,
    );

    // 1. CPU Dimension Recommendation
    const cpuRatio = metrics.cpuUtilizationPct / this.policy.targetCpuUtilizationPct;
    const cpuRecommended = Math.ceil(this.currentReplicas * Math.max(0.1, cpuRatio));

    // 2. Memory Dimension Recommendation
    const memRatio = metrics.memoryUtilizationPct / this.policy.targetMemoryUtilizationPct;
    const memRecommended = Math.ceil(this.currentReplicas * Math.max(0.1, memRatio));

    // 3. Queue Velocity Dimension Recommendation (Predictive)
    // How many pods needed to drain the projected 60s queue backlog within 60s?
    const requiredDrainPerSec = (velocity.projectedDepthIn60Sec / 60) + (velocity.velocityItemsPerSec > 0 ? velocity.velocityItemsPerSec : 0);
    const queueRecommended = Math.ceil(requiredDrainPerSec / this.policy.drainCapacityPerPodPerSec);

    // Composite desired replica: maximum of all dimensions
    let rawDesired = Math.max(cpuRecommended, memRecommended, queueRecommended);

    // Determine contributing factor
    let contributingFactor: ScalingEvaluationResult['contributingFactor'] = 'CPU';
    if (rawDesired === queueRecommended && queueRecommended >= cpuRecommended && queueRecommended >= memRecommended) {
      contributingFactor = 'QUEUE_VELOCITY';
    } else if (rawDesired === memRecommended && memRecommended >= cpuRecommended) {
      contributingFactor = 'MEMORY';
    } else {
      contributingFactor = 'CPU';
    }

    // Bound check within [minReplicas, maxReplicas]
    if (rawDesired < this.policy.minReplicas) {
      rawDesired = this.policy.minReplicas;
      contributingFactor = 'MIN_BOUND';
    } else if (rawDesired > this.policy.maxReplicas) {
      rawDesired = this.policy.maxReplicas;
      contributingFactor = 'MAX_BOUND';
    }

    // Flap damping & stabilization window logic
    let action: 'SCALE_UP' | 'SCALE_DOWN' | 'NO_OP' = 'NO_OP';
    let desiredReplicas = this.currentReplicas;
    let reason = 'Current replica count meets multi-dimensional demand';

    const timeSinceLastAction = now - this.lastScalingActionTime;

    if (rawDesired > this.currentReplicas) {
      // Scale-up path: Fast-path bypass cooldown if surge detected
      const isSurge = velocity.isSurgeDetected || (rawDesired - this.currentReplicas >= 5);
      if (isSurge || timeSinceLastAction >= this.policy.scaleUpCooldownMs) {
        action = 'SCALE_UP';
        desiredReplicas = rawDesired;
        reason = isSurge
          ? `Emergency surge scale-out triggered by ${contributingFactor} (projected depth: ${velocity.projectedDepthIn60Sec})`
          : `Scale-up triggered by ${contributingFactor} demand`;
      } else {
        reason = `Scale-up damped: scale-up cooldown active (${Math.round((this.policy.scaleUpCooldownMs - timeSinceLastAction) / 1000)}s remaining)`;
        contributingFactor = 'STABILIZED';
      }
    } else if (rawDesired < this.currentReplicas) {
      // Scale-down path: require stabilization window
      if (timeSinceLastAction >= this.policy.scaleDownCooldownMs) {
        // Enforce max scale-down step to prevent sudden resource starvation
        const maxDrop = Math.max(1, Math.floor(this.currentReplicas * (this.policy.maxScaleDownStepPct / 100)));
        const gradualTarget = Math.max(rawDesired, this.currentReplicas - maxDrop);

        action = 'SCALE_DOWN';
        desiredReplicas = gradualTarget;
        reason = `Gradual scale-down to ${gradualTarget} replicas (stabilization window passed)`;
      } else {
        reason = `Scale-down deferred: stabilization window active (${Math.round((this.policy.scaleDownCooldownMs - timeSinceLastAction) / 1000)}s remaining)`;
        contributingFactor = 'STABILIZED';
      }
    }

    return {
      currentReplicas: this.currentReplicas,
      desiredReplicas,
      action,
      reason,
      contributingFactor,
      cpuRecommendedReplicas: cpuRecommended,
      memRecommendedReplicas: memRecommended,
      queueRecommendedReplicas: queueRecommended,
      velocityMetrics: velocity,
      evaluatedAt: new Date(now),
    };
  }

  /**
   * Applies scaling evaluation, updates current state, and logs history.
   */
  public executeScaling(evaluation: ScalingEvaluationResult, now = Date.now()): boolean {
    if (evaluation.action === 'NO_OP' || evaluation.desiredReplicas === this.currentReplicas) {
      return false;
    }

    const previousReplicas = this.currentReplicas;
    this.currentReplicas = evaluation.desiredReplicas;
    this.lastScalingActionTime = now;
    this.lastActionType = evaluation.action;

    const entry: ScalingHistoryEntry = {
      timestamp: new Date(now),
      previousReplicas,
      newReplicas: this.currentReplicas,
      action: evaluation.action,
      reason: evaluation.reason,
      contributingFactor: evaluation.contributingFactor,
    };

    this.scalingHistory.unshift(entry);
    if (this.scalingHistory.length > this.maxHistoryLength) {
      this.scalingHistory.pop();
    }

    this.logger.log(
      `Autoscaling executed: [${entry.action}] ${previousReplicas} -> ${this.currentReplicas} pods. Factor: ${entry.contributingFactor}. Reason: ${entry.reason}`,
    );

    return true;
  }

  public getHistory(): ScalingHistoryEntry[] {
    return [...this.scalingHistory];
  }

  public reset(): void {
    this.currentReplicas = this.policy.minReplicas;
    this.lastScalingActionTime = 0;
    this.lastActionType = null;
    this.scalingHistory.length = 0;
    this.queueProbe.clear();
  }
}
