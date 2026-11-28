import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class DiffieHellmanTokenExchangeService {
  constructor(tokenTtlMs = 300000) {
    this.tokenTtlMs = tokenTtlMs;
  }

  generateServerKeyPair() {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.generateKeys();
    return {
      ecdh,
      publicKeyHex: ecdh.getPublicKey('hex')
    };
  }

  computeSharedSecret(serverEcdh, clientPublicKeyHex, sessionId, now = Date.now()) {
    const clientPubKeyBuffer = Buffer.from(clientPublicKeyHex, 'hex');
    const secret = serverEcdh.computeSecret(clientPubKeyBuffer);
    const sharedSecretHash = crypto.createHash('sha256').update(secret).digest('hex');

    return {
      sessionId,
      publicKeyHex: serverEcdh.getPublicKey('hex'),
      sharedSecretHash,
      expiresAt: now + this.tokenTtlMs
    };
  }

  isTokenExpired(result, now = Date.now()) {
    return now >= result.expiresAt;
  }
}

describe('DiffieHellmanTokenExchangeService', () => {
  const service = new DiffieHellmanTokenExchangeService(60000);

  it('exchanges keys and derives matching shared secrets between client and server', () => {
    const serverPair = service.generateServerKeyPair();

    const clientEcdh = crypto.createECDH('prime256v1');
    clientEcdh.generateKeys();
    const clientPubKeyHex = clientEcdh.getPublicKey('hex');

    const result = service.computeSharedSecret(serverPair.ecdh, clientPubKeyHex, 'sess-123', 1000);
    assert.equal(result.sessionId, 'sess-123');
    assert.equal(result.expiresAt, 61000);

    // Verify client derives identical secret
    const serverPubKeyBuffer = Buffer.from(result.publicKeyHex, 'hex');
    const clientSecret = clientEcdh.computeSecret(serverPubKeyBuffer);
    const clientSecretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');

    assert.equal(result.sharedSecretHash, clientSecretHash);
  });

  it('identifies expired session tokens', () => {
    const expiredRecord = {
      sessionId: 'sess-old',
      publicKeyHex: 'abc',
      sharedSecretHash: 'def',
      expiresAt: 5000
    };

    assert.equal(service.isTokenExpired(expiredRecord, 4000), false);
    assert.equal(service.isTokenExpired(expiredRecord, 6000), true);
  });
});
