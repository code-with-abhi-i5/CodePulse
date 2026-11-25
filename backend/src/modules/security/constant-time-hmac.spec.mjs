import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class ConstantTimeHmacService {
  signPayload(secret, payload) {
    const data = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  verifySignature(secret, payload, providedSignature) {
    const expected = this.signPayload(secret, payload);
    const expectedBuf = Buffer.from(expected, 'hex');
    let providedBuf;
    try {
      providedBuf = Buffer.from(providedSignature, 'hex');
    } catch {
      return false;
    }
    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  }
}

describe('ConstantTimeHmacService', () => {
  it('generates and validates constant-time HMAC-SHA256 signatures against timing attacks', () => {
    const service = new ConstantTimeHmacService();
    const secret = 'whsec_9876543210';
    const body = '{"status":"completed"}';
    const signature = service.signPayload(secret, body);

    assert.equal(service.verifySignature(secret, body, signature), true);
    assert.equal(service.verifySignature(secret, body, 'bad' + signature.slice(3)), false);
  });
});
