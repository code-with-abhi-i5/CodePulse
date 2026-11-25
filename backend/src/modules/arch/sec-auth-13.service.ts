/**
 * Architecture Service: SAML XML Signature Wrapping (XSW) Attack Detector
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-13]
 */

export class SamlXswAttackDetectorService {
  public validateSamlResponse(xml: string): { isSafe: boolean; error?: string } {
    // Check multiple Assertion elements shadowing each other
    const assertionMatches = xml.match(/<([a-zA-Z0-9]+:)?Assertion\b/g) || [];
    if (assertionMatches.length > 1) {
      return {
        isSafe: false,
        error: `XSW Attack Detected: XML contains ${assertionMatches.length} Assertion elements; shadow assertions prohibited.`
      };
    }

    // Check Signature Reference URI
    const refMatch = xml.match(/<([a-zA-Z0-9]+:)?Reference\s+URI=["']([^"']*)["']/);
    if (refMatch) {
      const uri = refMatch[2];
      if (!uri.startsWith('#') && uri.length > 0) {
        return {
          isSafe: false,
          error: 'XSW Attack Detected: Signature reference URI points to external or relative entity'
        };
      }
    }

    return { isSafe: true };
  }
}
