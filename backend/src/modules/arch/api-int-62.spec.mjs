import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WebhookSignatureRotationService } from './api-int-62.service.ts';

describe('WebhookSignatureRotationService (API-INT-62)', () => {
  it('signs and verifies payload using primary secret key', () => {
    const service = new WebhookSignatureRotationService();
    service.addKey('k1', 'secret-key-1', 'primary');

    const signed = service.signPayload('{"event":"submission.created"}');
    assert.strictEqual(signed.keyId, 'k1');

    const isValid = service.verifyPayload('{"event":"submission.created"}', signed.keyId, signed.signature, signed.timestamp);
    assert.strictEqual(isValid, true);
  });

  it('supports key rotation with dual-active verification window', () => {
    const service = new WebhookSignatureRotationService();
    service.addKey('k1', 'secret-key-1', 'primary');
    const signedWithK1 = service.signPayload('{"test":"payload"}');

    // Rotate to k2, demoting k1 to previous active key
    service.rotateKey('k2', 'secret-key-2');

    // Both new signature from k2 and old signature from k1 verify successfully
    const signedWithK2 = service.signPayload('{"test":"payload"}');
    assert.strictEqual(signedWithK2.keyId, 'k2');

    assert.strictEqual(service.verifyPayload('{"test":"payload"}', signedWithK1.keyId, signedWithK1.signature, signedWithK1.timestamp), true);
    assert.strictEqual(service.verifyPayload('{"test":"payload"}', signedWithK2.keyId, signedWithK2.signature, signedWithK2.timestamp), true);
  });
});
