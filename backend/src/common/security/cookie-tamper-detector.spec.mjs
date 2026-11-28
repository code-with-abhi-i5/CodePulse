import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class CookieTamperDetectorService {
  constructor(secretKey = 'secret-cookie-sign-key') {
    this.secretKey = secretKey;
  }

  signCookie(cookieName, value) {
    const hmac = crypto.createHmac('sha256', this.secretKey).update(cookieName + ':' + value).digest('base64url');
    return value + '.s:' + hmac;
  }

  verifyCookie(cookieName, signedCookieValue) {
    const dotIndex = signedCookieValue.lastIndexOf('.s:');
    if (dotIndex === -1) {
      return {
        isValid: false,
        cookieName,
        tamperDetected: true
      };
    }

    const value = signedCookieValue.slice(0, dotIndex);
    const signature = signedCookieValue.slice(dotIndex + 3);

    const expectedHmac = crypto.createHmac('sha256', this.secretKey).update(cookieName + ':' + value).digest('base64url');

    const isValid = signature.length === expectedHmac.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac));

    return {
      isValid,
      cookieName,
      payload: isValid ? value : undefined,
      tamperDetected: !isValid
    };
  }
}

describe('CookieTamperDetectorService', () => {
  const detector = new CookieTamperDetectorService('top-secret');

  it('signs and verifies authentic cookies', () => {
    const signed = detector.signCookie('session_id', 'user_session_abc123');
    const result = detector.verifyCookie('session_id', signed);

    assert.equal(result.isValid, true);
    assert.equal(result.tamperDetected, false);
    assert.equal(result.payload, 'user_session_abc123');
  });

  it('detects tampering when payload or signature is modified', () => {
    const signed = detector.signCookie('session_id', 'user_session_abc123');
    const tampered = signed.replace('abc123', 'admin999');

    const result = detector.verifyCookie('session_id', tampered);
    assert.equal(result.isValid, false);
    assert.equal(result.tamperDetected, true);
    assert.equal(result.payload, undefined);
  });
});
