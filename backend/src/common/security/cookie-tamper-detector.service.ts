import crypto from 'node:crypto';
import { CookieValidationResult } from '../../types/security';

export class CookieTamperDetectorService {
  constructor(private readonly secretKey: string = 'secret-cookie-sign-key') {}

  public signCookie(cookieName: string, value: string): string {
    const hmac = crypto.createHmac('sha256', this.secretKey).update(`${cookieName}:${value}`).digest('base64url');
    return `${value}.s:${hmac}`;
  }

  public verifyCookie(cookieName: string, signedCookieValue: string): CookieValidationResult {
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

    const expectedHmac = crypto.createHmac('sha256', this.secretKey).update(`${cookieName}:${value}`).digest('base64url');

    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac));

    return {
      isValid,
      cookieName,
      payload: isValid ? value : undefined,
      tamperDetected: !isValid
    };
  }
}
