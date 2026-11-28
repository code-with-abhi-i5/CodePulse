import crypto from 'node:crypto';
import { PasskeyVerificationResult } from '../../types/security';

export class PasskeySignatureVerifierService {
  constructor(private readonly expectedOrigin: string = 'https://codepulse.io') {}

  public verifyPasskeyAuth(
    userId: string,
    credentialId: string,
    clientDataJsonBase64: string,
    expectedChallenge: string,
    counter: number,
    previousCounter: number
  ): PasskeyVerificationResult {
    let clientData: any;
    try {
      const decoded = Buffer.from(clientDataJsonBase64, 'base64url').toString('utf8');
      clientData = JSON.parse(decoded);
    } catch {
      return { verified: false, userId, credentialId, counter, error: 'Malformed clientDataJSON' };
    }

    if (clientData.type !== 'webauthn.get') {
      return { verified: false, userId, credentialId, counter, error: 'Invalid WebAuthn operation type' };
    }

    if (clientData.challenge !== expectedChallenge) {
      return { verified: false, userId, credentialId, counter, error: 'Challenge mismatch' };
    }

    if (clientData.origin !== this.expectedOrigin) {
      return { verified: false, userId, credentialId, counter, error: `Origin "${clientData.origin}" mismatch` };
    }

    if (counter <= previousCounter) {
      return { verified: false, userId, credentialId, counter, error: 'Replay detected: sign counter did not increment' };
    }

    return {
      verified: true,
      userId,
      credentialId,
      counter
    };
  }
}
