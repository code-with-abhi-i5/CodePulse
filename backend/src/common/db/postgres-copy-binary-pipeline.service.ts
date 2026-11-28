import { BulkIngestResult } from '../../types/db';

export class PostgresCopyBinaryPipelineService {
  executeBulkIngest(rowCount: number, durationMs: number): BulkIngestResult {
    const durationSeconds = Math.max(durationMs / 1000, 0.001);
    const throughput = Math.round(rowCount / durationSeconds);

    return {
      rowsIngested: rowCount,
      durationMs,
      throughputRowsPerSec: throughput,
      protocol: 'COPY_BINARY'
    };
  }
}
