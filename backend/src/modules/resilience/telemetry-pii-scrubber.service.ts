export class TelemetryPiiScrubberService {
  private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private jwtRegex = /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g;
  private tokenRegex = /(?:ghp|bearer|token|apikey|password|secret|auth)[\s:=_"'\-`]+([a-zA-Z0-9_\-]{8,})/gi;

  public scrubString(text: string): string {
    if (!text) return '';
    let scrubbed = text.replace(this.emailRegex, '[REDACTED_EMAIL]');
    scrubbed = scrubbed.replace(this.jwtRegex, '[REDACTED_JWT]');
    scrubbed = scrubbed.replace(this.tokenRegex, (match, token) => match.replace(token, '[REDACTED_SECRET]'));
    return scrubbed;
  }

  public scrubObject(obj: any, seen = new WeakSet()): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return this.scrubString(obj);
    if (typeof obj !== 'object') return obj;

    if (seen.has(obj)) return '[CIRCULAR]';
    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(item => this.scrubObject(item, seen));
    }

    const sanitized: Record<string, any> = {};
    const sensitiveKeys = new Set(['password', 'secret', 'token', 'authorization', 'cookie', 'apikey']);

    for (const [key, val] of Object.entries(obj)) {
      if (sensitiveKeys.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.scrubObject(val, seen);
      }
    }

    return sanitized;
  }
}
