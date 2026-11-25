import { Injectable } from '@nestjs/common';
import { ChaosExperimentConfig, ChaosExperimentResult } from '../../types/observability';

@Injectable()
export class ChaosMeshMonkeyService {
  private activeExperiments: Map<string, ChaosExperimentConfig> = new Map();

  registerExperiment(experiment: ChaosExperimentConfig): string {
    const id = `chaos-${experiment.targetService}-${Date.now()}`;
    this.activeExperiments.set(id, experiment);
    return id;
  }

  simulateTraffic(experimentId: string, totalRequests: number): ChaosExperimentResult {
    const exp = this.activeExperiments.get(experimentId);
    if (!exp) throw new Error(`Experiment ${experimentId} not found`);

    const dropRate = exp.packetDropRate || 0;
    const latency = exp.latencyMs || 0;
    const thresholdErrors = exp.safeHaltThresholdErrors || 50;

    let dropped = 0;
    let safetyTripped = false;

    for (let i = 0; i < totalRequests; i++) {
      if (Math.random() < dropRate) dropped++;
      if (dropped >= thresholdErrors) {
        safetyTripped = true;
        break;
      }
    }

    const errorRate = dropped / totalRequests;
    const status = safetyTripped ? 'halted' : 'completed';

    return {
      experimentId,
      status,
      injectedLatencyMs: latency,
      droppedPackets: dropped,
      totalRequests,
      errorRate: parseFloat(errorRate.toFixed(4)),
      safetyTripped
    };
  }

  stopExperiment(experimentId: string): boolean {
    return this.activeExperiments.delete(experimentId);
  }
}
