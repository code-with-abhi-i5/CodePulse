import { Argon2idTuningParams } from '../../types/security';

export class Argon2idBenchmarkEngineService {
  public tuneParameters(targetLatencyMs: number = 250): Argon2idTuningParams {
    // Calibrate based on target latency: baseline is 64MB memory, 3 iterations, 4 threads ~ 250ms
    let memoryCostKiB = 65536; // 64 MB
    let timeCostIterations = 3;
    let parallelismThreads = 4;

    if (targetLatencyMs < 100) {
      memoryCostKiB = 32768; // 32 MB
      timeCostIterations = 2;
    } else if (targetLatencyMs > 500) {
      memoryCostKiB = 131072; // 128 MB
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

  public validateConfiguration(params: Argon2idTuningParams): boolean {
    return params.memoryCostKiB >= 16384 && params.timeCostIterations >= 1 && params.parallelismThreads >= 1;
  }
}
