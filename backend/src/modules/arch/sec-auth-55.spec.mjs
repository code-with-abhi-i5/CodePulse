import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { BugBountyPgpGatewayService } from './sec-auth-55.service.ts';

describe('BugBountyPgpGatewayService (SEC-AUTH-55)', () => {
  const { publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' }
  });

  it('encrypts bug bounty submissions into standardized armored security advisories', () => {
    const gateway = new BugBountyPgpGatewayService(publicKey);
    const sub = {
      researcherEmail: 'whitehat@security.org',
      vulnerabilityTitle: 'Stored XSS in Markdown Renderer',
      markdownDetails: 'Found unsanitized script tag injection in preview pane',
      severity: 'HIGH'
    };

    const res = gateway.encryptSubmission(sub);
    assert.ok(res.submissionId.startsWith('vuln_'));
    assert.ok(res.encryptedReport.includes('BEGIN CODEPULSE ENCRYPTED SECURITY ADVISORY'));
    assert.ok(res.encryptedReport.includes('END CODEPULSE ENCRYPTED SECURITY ADVISORY'));
    assert.strictEqual(res.sha256Fingerprint.length, 64);
  });
});
