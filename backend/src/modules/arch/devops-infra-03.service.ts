/**
 * Architecture Service: Kubernetes HPA Custom Metrics Adapter
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-03]
 */

export interface HpaAdapterConfig {
  targetConnectionsPerPod: number;
  minReplicas: number;
  maxReplicas: number;
}

export interface ScalingDecision {
  totalConnections: number;
  currentReplicas: number;
  desiredReplicas: number;
  scaleAction: 'SCALE_UP' | 'SCALE_DOWN' | 'MAINTAIN';
}

export class HpaCustomMetricsAdapterService {
  private config: HpaAdapterConfig;

  constructor(config?: Partial<HpaAdapterConfig>) {
    this.config = {
      targetConnectionsPerPod: config?.targetConnectionsPerPod ?? 2000,
      minReplicas: config?.minReplicas ?? 2,
      maxReplicas: config?.maxReplicas ?? 20
    };
  }

  public computeDesiredReplicas(totalConnections: number, currentReplicas: number): ScalingDecision {
    const rawTarget = Math.ceil(totalConnections / this.config.targetConnectionsPerPod);
    const desiredReplicas = Math.min(
      this.config.maxReplicas,
      Math.max(this.config.minReplicas, rawTarget)
    );

    let scaleAction: 'SCALE_UP' | 'SCALE_DOWN' | 'MAINTAIN' = 'MAINTAIN';
    if (desiredReplicas > currentReplicas) scaleAction = 'SCALE_UP';
    else if (desiredReplicas < currentReplicas) scaleAction = 'SCALE_DOWN';

    return {
      totalConnections,
      currentReplicas,
      desiredReplicas,
      scaleAction
    };
  }
}
