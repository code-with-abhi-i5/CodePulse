/**
 * Architecture Service: REST API Path Parameter Sanitizer
 * Subsystem: API Security & Path Traversal Prevention
 */

export class ApiPathSanitizerService {
  public sanitizeParam(param: string): string {
    // Decode URI sequences and remove null bytes
    let decoded = decodeURIComponent(param).replace(/\0/g, '');
    // Strip ../ and ..\
    decoded = decoded.replace(/\.\.[\/\\]/g, '');
    // Ensure no leading slashes or dots
    return decoded.replace(/^[\.\/\\]+/, '');
  }

  public isSafe(param: string): boolean {
    return !param.includes('..') && !param.includes('\0') && !param.includes('%00');
  }
}
