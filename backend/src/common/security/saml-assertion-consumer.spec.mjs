import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SamlAssertionConsumerService {
  constructor(expectedIssuer = 'https://idp.codepulse.io/sso') {
    this.expectedIssuer = expectedIssuer;
  }

  parseSamlResponse(samlXml, notBeforeMs, notOnOrAfterMs, now = Date.now()) {
    const errors = [];

    if (now < notBeforeMs) {
      errors.push('Assertion is not yet valid (NotBefore constraint violation)');
    }

    if (now >= notOnOrAfterMs) {
      errors.push('Assertion has expired (NotOnOrAfter constraint violation)');
    }

    const issuerMatch = samlXml.match(/<saml:Issuer[^>]*>(.*?)<\/saml:Issuer>/);
    const issuer = issuerMatch ? issuerMatch[1] : '';

    if (issuer !== this.expectedIssuer) {
      errors.push('Issuer mismatch: expected "' + this.expectedIssuer + '", got "' + issuer + '"');
    }

    const nameIdMatch = samlXml.match(/<saml:NameID[^>]*>(.*?)<\/saml:NameID>/);
    const nameId = nameIdMatch ? nameIdMatch[1] : '';

    const attributes = {};
    const attrRegex = /<saml:Attribute\s+Name="([^"]+)"[^>]*>\s*<saml:AttributeValue[^>]*>(.*?)<\/saml:AttributeValue>/g;
    let match;
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

describe('SamlAssertionConsumerService', () => {
  const consumer = new SamlAssertionConsumerService('https://idp.codepulse.io/sso');

  it('parses authentic SAML assertion XML and validates validity windows and attributes', () => {
    const xml = `
      <saml:Response>
        <saml:Issuer>https://idp.codepulse.io/sso</saml:Issuer>
        <saml:NameID>dev@codepulse.io</saml:NameID>
        <saml:Attribute Name="email"><saml:AttributeValue>dev@codepulse.io</saml:AttributeValue></saml:Attribute>
        <saml:Attribute Name="role"><saml:AttributeValue>ENGINEER</saml:AttributeValue></saml:Attribute>
      </saml:Response>
    `;

    const res = consumer.parseSamlResponse(xml, 1000, 50000, 10000);
    assert.equal(res.isValid, true);
    assert.equal(res.nameId, 'dev@codepulse.io');
    assert.equal(res.attributes.email, 'dev@codepulse.io');
    assert.equal(res.attributes.role, 'ENGINEER');
  });

  it('flags expired assertions or issuer mismatches', () => {
    const xml = '<saml:Issuer>https://malicious-idp.com</saml:Issuer>';
    const res = consumer.parseSamlResponse(xml, 1000, 5000, 10000);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('expired')));
    assert.ok(res.errors.some(e => e.includes('Issuer mismatch')));
  });
});
