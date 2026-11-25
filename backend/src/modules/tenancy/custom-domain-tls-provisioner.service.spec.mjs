import test from 'node:test';
import assert from 'node:assert/strict';

class CustomDomainTlsProvisioner {
  constructor(canonicalTarget = 'ingress.codepulse.io') {
    this.canonicalTarget = canonicalTarget;
  }

  verifyCname(cnameTarget) {
    return cnameTarget.toLowerCase().replace(/\.$/, '') === this.canonicalTarget.toLowerCase();
  }

  provisionTlsCertificate(domain, tenantId, resolvedCname) {
    const verified = this.verifyCname(resolvedCname);
    if (!verified) {
      return {
        domain,
        tenantId,
        cnameVerified: false,
        tlsCertificateIssued: false,
        status: 'pending_cname'
      };
    }

    const expires = new Date();
    expires.setDate(expires.getDate() + 90);

    return {
      domain,
      tenantId,
      cnameVerified: true,
      tlsCertificateIssued: true,
      expiresAt: expires.toISOString(),
      status: 'active'
    };
  }
}

test('CustomDomainTlsProvisioner - validates CNAME and issues TLS certificate', () => {
  const prov = new CustomDomainTlsProvisioner('ingress.codepulse.io');
  const valid = prov.provisionTlsCertificate('code.acme.com', 'tenant_acme', 'ingress.codepulse.io.');
  assert.strictEqual(valid.status, 'active');
  assert.strictEqual(valid.tlsCertificateIssued, true);

  const invalid = prov.provisionTlsCertificate('bad.acme.com', 'tenant_acme', 'wrong.host.com');
  assert.strictEqual(invalid.status, 'pending_cname');
  assert.strictEqual(invalid.tlsCertificateIssued, false);
});
