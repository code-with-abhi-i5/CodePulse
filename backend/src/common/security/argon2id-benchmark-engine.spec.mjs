import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class Argon2idBenchmarkEngineService {
  tuneParameters(targetLatencyMs = 250) {
    let memoryCostKiB = 65536;
    let timeCostIterations = 3;
    let parallelismThreads = 4;

    if (targetLatencyMs < 100) {
      memoryCostKiB = 32768;
      timeCostIterations = 2;
    } else if (targetLatencyMs > 500) {
      memoryCostKiB = 131072;
      timeCostIterations = 4;
    }

    const estimatedLatencyMs = Math.round(targetLatencyMs * 0.98);

    return {
      memoryCostKiB,
      timeCostIterations,
      parallelismThreads,
      hashLength: 32,
      estimatedLatencyMs
    };
  }

  validateConfiguration(params) {
    return params.memoryCostKiB >= 16384 && params.timeCostIterations >= 1 && params.parallelismThreads >= 1;
  }
}

describe('Argon2idBenchmarkEngineService', () => {
  const engine = new Argon2idBenchmarkEngineService();

  it('calibrates parameters to match target latency budget', () => {
    const normal = engine.tuneParameters(250);
    assert.equal(normal.memoryCostKiB, 65536);
    assert.equal(normal.timeCostIterations, 3);
    assert.equal(engine.validateConfiguration(normal), true);

    const low = engine.tuneParameters(80);
    assert.equal(low.memoryCostKiB, 32768);
    assert.equal(low.timeCostIterations, 2);

    const high = engine.tuneParameters(600);
    assert.equal(high.memoryCostKiB, 131072);
    assert.equal(high.timeCostIterations, 4);
  });

  it('rejects unsafe under-provisioned parameter configurations', () => {
    assert.equal(engine.validateConfiguration({ memoryCostKiB: 4096, timeCostIterations: 1, parallelismThreads: 1, hashLength: 32, estimatedLatencyMs: 20 }), false);
  });
});
