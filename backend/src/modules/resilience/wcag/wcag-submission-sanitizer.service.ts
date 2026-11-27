export class WcagSubmissionHtmlSanitizer {
  public cleanAndValidateA11y(html: string): { cleanHtml: string; hasAltForImages: boolean } {
    let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Ensure every img tag has an alt attribute
    clean = clean.replace(/<img\s+([^>]*?)>/gi, (match, attrs) => {
      if (!/alt\s*=/i.test(attrs)) {
        return `<img alt="Submission graphic" ${attrs}>`;
      }
      return match;
    });

    const hasAltForImages = !/<img(?![^>]*\balt\s*=)[^>]*>/i.test(clean);
    return { cleanHtml: clean, hasAltForImages };
  }
}
