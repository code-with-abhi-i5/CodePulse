export class ChallengeHtmlSanitizer {
  sanitizeSubmission(html: string): string {
    if (!html || typeof html !== 'string') return '';
    let clean = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    clean = clean.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
    clean = clean.replace(/javascript\s*:/gi, 'blocked:');
    clean = clean.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
    clean = clean.replace(/<object[\s\S]*?<\/object>/gi, '');
    return clean.trim();
  }

  escapeSpecialChars(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
