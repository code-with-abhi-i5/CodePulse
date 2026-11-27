export class ViewportSubmissionSanitizer {
  sanitizeAndFormatCode(input: string, maxViewportChars = 80) {
    const stripped = input.replace(/<script[\s\S]*?<\/script>/gi, '');
    const clean = stripped.replace(/<[^>]+>/g, '');
    const lines = clean.split('\n').map(line => {
      if (line.length > maxViewportChars) {
        return line.slice(0, maxViewportChars) + '...';
      }
      return line;
    });
    return lines.join('\n');
  }
}
