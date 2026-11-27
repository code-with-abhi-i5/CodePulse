export class CrashTelemetryPiiScrubberVerifier {
  private tokenKeywords = ['bearer', 'ghp_', 'eyjhb', 'apikey', 'secret'];

  public scrubString(input: string): string {
    let clean = input;
    // Replace emails
    clean = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    // Replace bearer tokens
    clean = clean.replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]');
    // Replace GitHub / API keys
    clean = clean.replace(/ghp_[a-zA-Z0-9]{20,}/g, '[REDACTED_APIKEY]');
    return clean;
  }

  public verifyClean(input: string): boolean {
    const lower = input.toLowerCase();
    return !lower.includes('ghp_') && !lower.includes('@example.com');
  }
}
