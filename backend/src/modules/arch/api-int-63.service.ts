/**
 * Architecture Service: REST API Bulk Import Streaming JSONLines Validator
 * Subsystem: API Communication Protocols & Ingress Management [API-INT-63]
 */

export interface BulkValidationResult<T> {
  totalProcessed: number;
  validItems: T[];
  errors: Array<{ lineNumber: number; rawLine: string; error: string }>;
  successRate: number;
}

export type RecordValidator<T> = (record: unknown) => { valid: boolean; value?: T; error?: string };

export class RestApiBulkImportStreamerService {
  public parseAndValidateJsonLines<T>(
    ndjsonStream: string,
    validator: RecordValidator<T>,
    maxErrors: number = 100
  ): BulkValidationResult<T> {
    const lines = ndjsonStream.split('\n');
    const validItems: T[] = [];
    const errors: Array<{ lineNumber: number; rawLine: string; error: string }> = [];
    let totalProcessed = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      totalProcessed++;

      try {
        const parsed = JSON.parse(line);
        const validation = validator(parsed);
        if (validation.valid && validation.value !== undefined) {
          validItems.push(validation.value);
        } else {
          errors.push({
            lineNumber: i + 1,
            rawLine: line,
            error: validation.error || 'Record failed schema validation'
          });
        }
      } catch (err: any) {
        errors.push({
          lineNumber: i + 1,
          rawLine: line,
          error: `JSON parsing error: ${err.message}`
        });
      }

      if (errors.length >= maxErrors) {
        break;
      }
    }

    const successRate = totalProcessed === 0 ? 1 : validItems.length / totalProcessed;
    return {
      totalProcessed,
      validItems,
      errors,
      successRate
    };
  }
}
