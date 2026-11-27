export class DarkThemeTelemetrySanitizer {
  public scrubAndTag(data: string): { clean: string; theme: string } {
    const clean = data.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED]');
    return { clean, theme: 'dark-high-contrast' };
  }
}
