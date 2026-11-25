/**
 * Architecture Service: Route Handler Micro-Benchmark Suite
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-08]
 */

export interface BenchmarkResult {
  route: string;
  iterations: number;
  avgDurationNs: number;
  p99DurationNs: number;
  regressionDetected: boolean;
}

export class RouteMicroBenchmarkSuiteService {
  public runBenchmark(route: string, iterations: number, fn: () => void, baselineAvgNs?: number): BenchmarkResult {
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      fn();
      const end = process.hrtime.bigint();
      durations.push(Number(end - start));
    }

    durations.sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avgDurationNs = Math.round(sum / iterations);
    const p99Index = Math.min(durations.length - 1, Math.floor(durations.length * 0.99));
    const p99DurationNs = durations[p99Index];

    const regressionDetected = baselineAvgNs ? avgDurationNs > baselineAvgNs * 1.25 : false;

    return {
      route,
      iterations,
      avgDurationNs,
      p99DurationNs,
      regressionDetected
    };
  }
}
