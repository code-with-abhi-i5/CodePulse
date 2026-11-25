import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class ChaosMeshMonkeyService {
  constructor() {
    this.activeExperiments = new Map();
  }

  registerExperiment(experiment) {
    const id = `chaos-${experiment.targetService}-${Date.now()}`;
    this.activeExperiments.set(id, experiment);
    return id;
  }

  simulateTraffic(experimentId, totalRequests) {
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

  stopExperiment(experimentId) {
    return this.activeExperiments.delete(experimentId);
  }
}

describe('ChaosMeshMonkeyService', () => {
  it('injects packet drop simulation and safely halts when threshold errors are exceeded', () => {
    const service = new ChaosMeshMonkeyService();
    const expId = service.registerExperiment({
      name: 'network-latency-partition',
      targetService: 'auth-service',
      latencyMs: 120,
      packetDropRate: 0.8,
      safeHaltThresholdErrors: 10
    });

    const result = service.simulateTraffic(expId, 100);
    assert.strictEqual(result.safetyTripped, true);
    assert.strictEqual(result.status, 'halted');
    assert.strictEqual(result.injectedLatencyMs, 120);
    assert.ok(result.droppedPackets >= 10);
  });
});
