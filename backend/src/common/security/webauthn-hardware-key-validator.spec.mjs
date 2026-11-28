import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class WebauthnHardwareKeyValidatorService {
  parseAuthenticatorFlags(flagsByte) {
    return {
      userPresent: (flagsByte & 0x01) !== 0,
      userVerified: (flagsByte & 0x04) !== 0,
      backupEligible: (flagsByte & 0x08) !== 0,
      backupState: (flagsByte & 0x10) !== 0
    };
  }

  validateAssertionFlags(flagsByte, requireUserVerification = true) {
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

describe('WebauthnHardwareKeyValidatorService', () => {
  const validator = new WebauthnHardwareKeyValidatorService();

  it('validates authentic WebAuthn flags with UP and UV set', () => {
    // 0x05 = 0x01 (UP) | 0x04 (UV)
    const res = validator.validateAssertionFlags(0x05, true);
    assert.equal(res.isValid, true);
    assert.equal(res.flags.userPresent, true);
    assert.equal(res.flags.userVerified, true);
  });

  it('rejects assertions missing user presence or user verification when required', () => {
    // 0x01 = UP only, UV missing
    const resNoUv = validator.validateAssertionFlags(0x01, true);
    assert.equal(resNoUv.isValid, false);
    assert.ok(resNoUv.error.includes('User Verification (UV)'));

    // 0x00 = UP missing
    const resNoUp = validator.validateAssertionFlags(0x00, false);
    assert.equal(resNoUp.isValid, false);
    assert.ok(resNoUp.error.includes('User Presence (UP)'));
  });
});
