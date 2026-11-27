export class DarkThemeSubmissionSanitizer {
  public sanitize(html: string): string {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  public getCodeBlockStyles(): { background: string; color: string } {
    return {
      background: '#0B0F19',
      color: '#E2E8F0'
    };
  }
}
