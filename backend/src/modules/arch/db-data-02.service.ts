/**
 * Architecture Service: ClickHouse Query Memory Limit Protector
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-02]
 */

export class ClickHouseQueryMemoryProtectorService {
  private memoryThresholdBytes: number;

  constructor(memoryThresholdBytes: number = 2 * 1024 * 1024 * 1024) { // 2 GB
    this.memoryThresholdBytes = memoryThresholdBytes;
  }

  public protectQuery(query: string, estimatedRows: number, rowSizeBytes: number = 128): {
    rewrittenQuery: string;
    samplingApplied: boolean;
    sampleRate: number;
    estimatedMemoryBytes: number;
  } {
    const estimatedMemoryBytes = estimatedRows * rowSizeBytes;
    if (estimatedMemoryBytes <= this.memoryThresholdBytes) {
      return { rewrittenQuery: query, samplingApplied: false, sampleRate: 1.0, estimatedMemoryBytes };
    }

    const sampleRate = Math.max(0.01, Number((this.memoryThresholdBytes / estimatedMemoryBytes).toFixed(2)));
    const rewrittenQuery = query.replace(/FROM\s+([a-zA-Z0-9_]+)/i, `FROM $1 SAMPLE ${sampleRate}`);

    return {
      rewrittenQuery,
      samplingApplied: true,
      sampleRate,
      estimatedMemoryBytes: estimatedMemoryBytes * sampleRate
    };
  }
}
