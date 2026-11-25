import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SamlXswAttackDetectorService } from './sec-auth-13.service.ts';

describe('SamlXswAttackDetectorService (SEC-AUTH-13)', () => {
  it('detects multiple shadow assertions in XML signature wrapping attacks', () => {
    const detector = new SamlXswAttackDetectorService();

    const maliciousXml = `
      <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
        <saml:Assertion ID="_legit_id">Signed</saml:Assertion>
        <saml:Assertion ID="_shadow_id">Forged Admin</saml:Assertion>
      </samlp:Response>
    `;

    const res = detector.validateSamlResponse(maliciousXml);
    assert.strictEqual(res.isSafe, false);
    assert.ok(res.error.includes('shadow assertions prohibited'));

    const legitXml = `
      <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
        <saml:Assertion ID="_legit_id">Signed</saml:Assertion>
      </samlp:Response>
    `;
    assert.strictEqual(detector.validateSamlResponse(legitXml).isSafe, true);
  });
});
