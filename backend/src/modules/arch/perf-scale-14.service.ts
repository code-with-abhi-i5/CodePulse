/**
 * Architecture Service: Query Result Projection Optimizer
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-14]
 */

export class QueryProjectionOptimizerService {
  private heavyColumns: Set<string>;

  constructor(heavyColumns: string[] = ['raw_source_code', 'ast_dump', 'compiler_log_blob', 'submission_trace']) {
    this.heavyColumns = new Set(heavyColumns);
  }

  public optimizeProjection<T extends Record<string, any>>(row: T, requestedFields?: (keyof T)[]): Partial<T> {
    if (requestedFields && requestedFields.length > 0) {
      const projected: Partial<T> = {};
      for (const field of requestedFields) {
        if (field in row) {
          projected[field] = row[field];
        }
      }
      return projected;
    }

    // Default: strip heavy columns
    const sanitized: Partial<T> = {};
    for (const key of Object.keys(row) as (keyof T)[]) {
      if (!this.heavyColumns.has(key as string)) {
        sanitized[key] = row[key];
      }
    }
    return sanitized;
  }
}
