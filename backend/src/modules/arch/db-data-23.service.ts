/**
 * Architecture Service: Prisma N+1 Query Detector & Telemetry Logger
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-23]
 */

export class PrismaNPlusOneDetectorService {
  private threshold: number;
  private queryCounts: Map<string, number>;

  constructor(threshold: number = 3) {
    this.threshold = threshold;
    this.queryCounts = new Map();
  }

  public recordQuery(model: string, action: string, fingerprint: string): {
    isNPlusOne: boolean;
    count: number;
    warning?: string;
  } {
    const key = `${model}.${action}:${fingerprint}`;
    const count = (this.queryCounts.get(key) || 0) + 1;
    this.queryCounts.set(key, count);

    if (count >= this.threshold) {
      return {
        isNPlusOne: true,
        count,
        warning: `Potential N+1 query detected on ${model}.${action} (invoked ${count} times in same context)`
      };
    }

    return { isNPlusOne: false, count };
  }

  public reset(): void {
    this.queryCounts.clear();
  }
}
