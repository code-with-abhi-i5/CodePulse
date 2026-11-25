/**
 * Architecture Service: Prisma Query Sanitizer for Comment Injections
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-32]
 */

export class PrismaQuerySanitizerMiddlewareService {
  private dangerousPatterns: RegExp[];

  constructor() {
    this.dangerousPatterns = [
      /--/g,               // SQL line comment
      /\/\*[\s\S]*?\*\//g, // SQL block comment
      /;\s*(DROP|ALTER|TRUNCATE|DELETE)/gi, // stacked statements
      /xp_cmdshell/gi      // command execution probe
    ];
  }

  public sanitizeInput(input: string): { isSafe: boolean; sanitized: string; flaggedPattern?: string } {
    let sanitized = input;
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, '');
        return { isSafe: false, sanitized: sanitized.trim(), flaggedPattern: pattern.source };
      }
    }
    return { isSafe: true, sanitized };
  }
}
