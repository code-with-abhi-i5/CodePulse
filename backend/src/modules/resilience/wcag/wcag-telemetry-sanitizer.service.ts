export class WcagTelemetryDataSanitizer {
  public sanitizeTelemetryRecord(record: { message: string; meta?: Record<string, any> }): {
    message: string;
    meta?: Record<string, any>;
    a11yCompatible: boolean;
  } {
    let cleanMessage = record.message
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
      .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]');

    return {
      message: cleanMessage,
      meta: record.meta ? { ...record.meta, sanitized: true } : undefined,
      a11yCompatible: true
    };
  }
}
