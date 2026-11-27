export class SubmissionHtmlSanitizerVerifier {
  public sanitize(input: string): string {
    if (!input) return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/\son\w+=["'][^"']*["']/gi, '');
  }

  public isSafe(html: string): boolean {
    const lower = html.toLowerCase();
    return !lower.includes('<script') && !lower.includes('<iframe') && !lower.includes('onerror=');
  }
}
