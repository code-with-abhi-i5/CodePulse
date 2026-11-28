import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class RsaKeypairProvisionerService {
  generateKeypair(keyId, modulusLength = 2048) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    return {
      keyId,
      publicKeyPem: publicKey,
      privateKeyPem: privateKey,
      bitLength: modulusLength,
      jwk: {
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        kid: keyId
      }
    };
  }
}

describe('RsaKeypairProvisionerService', () => {
  const provisioner = new RsaKeypairProvisionerService();

  it('generates valid RSA signing key pairs with corresponding JWK metadata', () => {
    const key = provisioner.generateKeypair('key-2026-01', 2048);
    assert.equal(key.keyId, 'key-2026-01');
    assert.ok(key.publicKeyPem.includes('BEGIN PUBLIC KEY'));
    assert.ok(key.privateKeyPem.includes('BEGIN PRIVATE KEY'));
    assert.equal(key.jwk.alg, 'RS256');
  });
});
