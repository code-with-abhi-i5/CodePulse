import { BenchmarkMetrics } from '../../types/ai';

export class ModelThroughputBenchmarkService {
  private readonly defaultTpsSlo = 25.0;

  evaluateThroughput(modelName: string, totalTokens: number, durationMs: number, timeToFirstTokenMs: number): BenchmarkMetrics {
    const durationSeconds = Math.max(durationMs / 1000, 0.001);
    const tokensPerSecond = Math.round((totalTokens / durationSeconds) * 100) / 100;
    const isWithinSlo = tokensPerSecond >= this.defaultTpsSlo && timeToFirstTokenMs <= 1500;

    return {
      modelName,
      totalTokens,
      durationMs,
      timeToFirstTokenMs,
      tokensPerSecond,
      isWithinSlo
    };
  }
}
