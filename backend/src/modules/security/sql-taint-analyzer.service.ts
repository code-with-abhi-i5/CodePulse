import { Injectable } from '@nestjs/common';

@Injectable()
export class SqlTaintAnalyzerService {
  private readonly injectionPatterns = [
    /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
    /\bUNION\s+(ALL\s+)?SELECT\b/i,
    /--|\/\*|\*\//,
    /;\s*(DROP|DELETE|UPDATE|INSERT)\b/i,
    /\bSLEEP\s*\(\s*\d+\s*\)/i,
    /\bBENCHMARK\s*\(/i,
  ];

  detectSqlInjection(input: string): boolean {
    if (typeof input !== 'string') return false;
    return this.injectionPatterns.some(pattern => pattern.test(input));
  }

  analyzeParameters(params: Record<string, any> | any[]): { isTainted: boolean; violations: string[] } {
    const violations: string[] = [];
    const entries = Array.isArray(params) ? params : Object.values(params);

    for (const val of entries) {
      if (typeof val === 'string' && this.detectSqlInjection(val)) {
        violations.push(`Potential SQL injection pattern detected in input: ${val.slice(0, 30)}`);
      }
    }

    return {
      isTainted: violations.length > 0,
      violations,
    };
  }
}
