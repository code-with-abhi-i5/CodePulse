import { SamlAssertionResult } from '../../types/security';

export class SamlAssertionConsumerService {
  constructor(private readonly expectedIssuer: string = 'https://idp.codepulse.io/sso') {}

  public parseSamlResponse(
    samlXml: string,
    notBeforeMs: number,
    notOnOrAfterMs: number,
    now: number = Date.now()
  ): SamlAssertionResult {
    const errors: string[] = [];

    if (now < notBeforeMs) {
      errors.push('Assertion is not yet valid (NotBefore constraint violation)');
    }

    if (now >= notOnOrAfterMs) {
      errors.push('Assertion has expired (NotOnOrAfter constraint violation)');
    }

    const issuerMatch = samlXml.match(/<saml:Issuer[^>]*>(.*?)<\/saml:Issuer>/);
    const issuer = issuerMatch ? issuerMatch[1] : '';

    if (issuer !== this.expectedIssuer) {
      errors.push(`Issuer mismatch: expected "${this.expectedIssuer}", got "${issuer}"`);
    }

    const nameIdMatch = samlXml.match(/<saml:NameID[^>]*>(.*?)<\/saml:NameID>/);
    const nameId = nameIdMatch ? nameIdMatch[1] : '';

    const attributes: Record<string, string> = {};
    const attrRegex = /<saml:Attribute\s+Name="([^"]+)"[^>]*>\s*<saml:AttributeValue[^>]*>(.*?)<\/saml:AttributeValue>/g;
    let match: RegExpExecArray | null;
    while ((match = attrRegex.exec(samlXml)) !== null) {
      attributes[match[1]] = match[2];
    }

    return {
      isValid: errors.length === 0,
      nameId,
      attributes,
      issuer,
      errors
    };
  }
}
