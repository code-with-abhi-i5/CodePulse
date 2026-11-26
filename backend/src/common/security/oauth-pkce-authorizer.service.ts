import crypto from 'node:crypto';
import { PkceVerificationResult } from '../../types/security';

export class OAuthPkceAuthorizerService {
  public generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  public verifyPkce(codeVerifier: string, codeChallenge: string, method: string = 'S256'): PkceVerificationResult {
    if (method !== 'S256') {
      return {
        valid: false,
        error: 'Only S256 PKCE code challenge method is permitted in production'
      };
    }

    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
      return {
        valid: false,
        error: 'Code verifier length must be between 43 and 128 characters'
      };
    }

    const calculatedChallenge = this.generateCodeChallenge(codeVerifier);
    const valid = crypto.timingSafeEqual(Buffer.from(calculatedChallenge), Buffer.from(codeChallenge));

    return {
      valid,
      error: valid ? undefined : 'PKCE code challenge verification failed'
    };
  }
}
