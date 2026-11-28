import crypto from 'node:crypto';
import { CspHeaderDirectives } from '../../types/security';

export class CspNonceGeneratorService {
  public generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  public buildCspHeader(nonce: string): CspHeaderDirectives {
    const policy = [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'nonce-${nonce}'`,
      `object-src 'none'`,
      `base-uri 'self'`
    ].join('; ');

    return {
      nonce,
      contentSecurityPolicyHeader: policy
    };
  }
}
