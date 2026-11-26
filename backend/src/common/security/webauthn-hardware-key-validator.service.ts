import { WebauthnHardwareFlags } from '../../types/security';

export class WebauthnHardwareKeyValidatorService {
  public parseAuthenticatorFlags(flagsByte: number): WebauthnHardwareFlags {
    return {
      userPresent: (flagsByte & 0x01) !== 0,
      userVerified: (flagsByte & 0x04) !== 0,
      backupEligible: (flagsByte & 0x08) !== 0,
      backupState: (flagsByte & 0x10) !== 0
    };
  }

  public validateAssertionFlags(flagsByte: number, requireUserVerification: boolean = true): { isValid: boolean; flags: WebauthnHardwareFlags; error?: string } {
    const flags = this.parseAuthenticatorFlags(flagsByte);

    if (!flags.userPresent) {
      return { isValid: false, flags, error: 'User Presence (UP) flag was not set' };
    }

    if (requireUserVerification && !flags.userVerified) {
      return { isValid: false, flags, error: 'User Verification (UV) biometric/PIN flag required but not set' };
    }

    return { isValid: true, flags };
  }
}
