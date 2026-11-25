/**
 * Architecture Service: CSRF Double-Submit Cookie Guard
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-07]
 */

import crypto from 'node:crypto';

export class CsrfDoubleSubmitCookieGuardService {
  private hmacSecret: string;

  constructor(hmacSecret: string = 'csrf-secret-key-32-bytes-minimum!') {
    this.hmacSecret = hmacSecret;
  }

  public generateCsrfToken(sessionId: string): { cookieValue: string; headerValue: string } {
    const randomNonce = crypto.randomBytes(16).toString('hex');
    const signature = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(`${sessionId}:${randomNonce}`)
      .digest('hex');

    const token = `${randomNonce}.${signature}`;
    return { cookieValue: token, headerValue: token };
  }

  public validateCsrfRequest(sessionId: string, cookieToken?: string, headerToken?: string): boolean {
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return false;
    }

    const [nonce, signature] = cookieToken.split('.');
    if (!nonce || !signature) return false;

    const expectedSig = crypto
      .createHmac('sha256', this.hmacSecret)
      .update(`${sessionId}:${nonce}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'));
  }
}
