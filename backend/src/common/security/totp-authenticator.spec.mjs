import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class TotpAuthenticatorService {
  constructor(timeStepSeconds = 30, codeDigits = 6) {
    this.timeStepSeconds = timeStepSeconds;
    this.codeDigits = codeDigits;
  }

  generateCode(secret, timestampMs = Date.now()) {
    const counter = Math.floor(timestampMs / 1000 / this.timeStepSeconds);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', secret).update(counterBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary = ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, this.codeDigits);
    return String(otp).padStart(this.codeDigits, '0');
  }

  validateCodeWithDrift(secret, token, maxDriftSteps = 1, timestampMs = Date.now()) {
    for (let step = -maxDriftSteps; step <= maxDriftSteps; step++) {
      const checkTimestamp = timestampMs + step * this.timeStepSeconds * 1000;
      const expected = this.generateCode(secret, checkTimestamp);
      if (expected === token) {
        return {
          isValid: true,
          driftSteps: step,
          stepOffsetSeconds: step * this.timeStepSeconds
        };
      }
    }

    return {
      isValid: false,
      driftSteps: 0,
      stepOffsetSeconds: 0
    };
  }
}

describe('TotpAuthenticatorService', () => {
  const totp = new TotpAuthenticatorService(30, 6);
  const secret = 'MY_SUPER_SECRET_KEY';

  it('generates deterministic 6-digit OTP codes for given timestamp', () => {
    const code = totp.generateCode(secret, 1000000000);
    assert.equal(code.length, 6);
    assert.match(code, /^\d{6}$/);
  });

  it('validates codes with matching current and drifted clock windows', () => {
    const now = 1000000000;
    const currentCode = totp.generateCode(secret, now);
    const resNow = totp.validateCodeWithDrift(secret, currentCode, 1, now);
    assert.equal(resNow.isValid, true);
    assert.equal(resNow.driftSteps, 0);

    // 30 seconds ago
    const pastCode = totp.generateCode(secret, now - 30000);
    const resPast = totp.validateCodeWithDrift(secret, pastCode, 1, now);
    assert.equal(resPast.isValid, true);
    assert.equal(resPast.driftSteps, -1);
  });

  it('rejects invalid or severely drifted tokens', () => {
    const resBad = totp.validateCodeWithDrift(secret, '000000', 1, 1000000000);
    assert.equal(resBad.isValid, false);
  });
});
