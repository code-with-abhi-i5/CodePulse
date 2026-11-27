export class ChallengeSubmissionSanitizerService {
  private dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'style', 'meta', 'link'];
  private dangerousAttrs = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
    'javascript:', 'data:', 'vbscript:'
  ];

  public sanitize(htmlInput: string): string {
    if (!htmlInput) return '';

    let clean = htmlInput;

    // Strip dangerous tags completely
    for (const tag of this.dangerousTags) {
      const tagRegex = new RegExp('<\\s*\\/?\\s*' + tag + '[^>]*>', 'gi');
      clean = clean.replace(tagRegex, '');
    }

    // Strip dangerous attributes
    for (const attr of this.dangerousAttrs) {
      const attrRegex = new RegExp(attr + '[\\s=\\"\\\']*[^>\\s]*', 'gi');
      clean = clean.replace(attrRegex, '');
    }

    // Secure external links with rel="noopener noreferrer"
    clean = clean.replace(/<a\s+href=/gi, '<a rel="noopener noreferrer" target="_blank" href=');

    return clean.trim();
  }
}
