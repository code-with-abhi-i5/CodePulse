/**
 * Architecture Service: XML External Entity (XXE) Injection Guard
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-35]
 */

export class XxeInjectionGuardService {
  public sanitizeXml(rawXml: string): { isSafe: boolean; sanitizedXml: string; error?: string } {
    // Check for DTD external entity declarations
    if (/<!DOCTYPE\b/i.test(rawXml) || /<!ENTITY\b/i.test(rawXml)) {
      if (/SYSTEM\s+["'][^"']+["']/i.test(rawXml) || /PUBLIC\s+["'][^"']+["']/i.test(rawXml)) {
        return {
          isSafe: false,
          sanitizedXml: '',
          error: 'XXE Attack Detected: External DTD entity declarations (SYSTEM/PUBLIC) are forbidden.'
        };
      }
    }

    // Strip DOCTYPE blocks completely for safe downstream consumption
    const cleanXml = rawXml.replace(/<!DOCTYPE[\s\S]*?>/gi, '').trim();

    return {
      isSafe: true,
      sanitizedXml: cleanXml
    };
  }
}
