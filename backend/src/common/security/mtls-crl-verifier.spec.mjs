import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class MtlsCrlVerifierService {
  constructor(crlIssuer = 'CodePulse-Intermediate-CA') {
    this.crlIssuer = crlIssuer;
    this.revokedSerials = new Map();
  }

  loadRevokedSerial(serialNumber, reason = 'KeyCompromise') {
    this.revokedSerials.set(serialNumber.toUpperCase(), reason);
  }

  verifyCertificate(serialNumber) {
    const formatted = serialNumber.toUpperCase();
    const isRevoked = this.revokedSerials.has(formatted);

    return {
      isRevoked,
      serialNumber: formatted,
      revocationReason: isRevoked ? this.revokedSerials.get(formatted) : undefined,
      crlIssuer: this.crlIssuer
    };
  }
}

describe('MtlsCrlVerifierService', () => {
  const verifier = new MtlsCrlVerifierService();
  verifier.loadRevokedSerial('0A1B2C3D4E', 'PrivilegeWithdrawn');

  it('rejects revoked peer certificates with revocation reason', () => {
    const res = verifier.verifyCertificate('0a1b2c3d4e');
    assert.equal(res.isRevoked, true);
    assert.equal(res.revocationReason, 'PrivilegeWithdrawn');
  });

  it('approves active unrevoked peer certificates', () => {
    const res = verifier.verifyCertificate('FAFBFCFDFE');
    assert.equal(res.isRevoked, false);
    assert.equal(res.revocationReason, undefined);
  });
});
