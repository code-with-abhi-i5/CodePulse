/**
 * Architecture Service: WebAuthn / FIDO2 Hardware Key Authentication Provider
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-01]
 */

export interface WebAuthnAssertion {
  credentialId: string;
  clientDataJson: string; // base64
  authenticatorData: string; // base64
  signature: string; // base64
  signCount: number;
}

export class WebAuthnFido2ProviderService {
  private expectedRpId: string;
  private expectedOrigin: string;

  constructor(expectedRpId: string = 'codepulse.io', expectedOrigin: string = 'https://codepulse.io') {
    this.expectedRpId = expectedRpId;
    this.expectedOrigin = expectedOrigin;
  }

  public verifyAssertion(
    assertion: WebAuthnAssertion,
    expectedChallenge: string,
    storedSignCount: number
  ): { isValid: boolean; error?: string; newSignCount?: number } {
    try {
      const clientDataRaw = Buffer.from(assertion.clientDataJson, 'base64').toString('utf8');
      const clientData = JSON.parse(clientDataRaw);

      if (clientData.type !== 'webauthn.get') {
        return { isValid: false, error: 'Invalid clientData type; expected webauthn.get' };
      }

      if (clientData.challenge !== expectedChallenge) {
        return { isValid: false, error: 'Challenge mismatch in WebAuthn response' };
      }

      if (clientData.origin !== this.expectedOrigin) {
        return { isValid: false, error: 'Origin mismatch in WebAuthn response' };
      }

      // Check signCount clone / replay protection
      if (assertion.signCount <= storedSignCount) {
        return { isValid: false, error: 'Authenticator signCount did not advance; potential cloned authenticator attack' };
      }

      return {
        isValid: true,
        newSignCount: assertion.signCount
      };
    } catch (err: any) {
      return { isValid: false, error: `Malformed clientData: ${err.message}` };
    }
  }
}
