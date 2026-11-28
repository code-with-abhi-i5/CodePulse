import { SqliScanResult } from '../../types/security';

export class SqliLexicalScannerService {
  private readonly suspiciousPatterns = [
    /(--|#|\/\*)/,                           // SQL comments
    /(\bUNION\s+ALL\s+SELECT\b|\bUNION\s+SELECT\b)/i,
    /(\bOR\s+1\s*=\s*1\b|\bOR\s+'a'\s*=\s*'a'\b)/i,
    /(\bDROP\s+TABLE\b|\bTRUNCATE\s+TABLE\b)/i,
    /(;\s*SELECT|;\s*UPDATE|;\s*DELETE)/i
  ];

  public scanFragment(sqlFragment: string): SqliScanResult {
    const detectedPatterns: string[] = [];

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(sqlFragment)) {
        detectedPatterns.push(pattern.source);
      }
    }

    const hasInjection = detectedPatterns.length > 0;
    let riskLevel: 'CRITICAL' | 'HIGH' | 'LOW' | 'NONE' = 'NONE';

    if (hasInjection) {
      riskLevel = detectedPatterns.some(p => p.includes('DROP') || p.includes('UNION'))
        ? 'CRITICAL'
        : 'HIGH';
    }

    return {
      hasInjection,
      detectedPatterns,
      riskLevel
    };
  }
}
