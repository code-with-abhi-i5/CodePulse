import crypto from 'node:crypto';
import { TotpValidationResult } from '../../types/security';

export class TotpAuthenticatorService {
  constructor(
    private readonly timeStepSeconds: number = 30,
    private readonly codeDigits: number = 6
  ) {}

  public generateCode(secret: string, timestampMs: number = Date.now()): string {
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

  public validateCodeWithDrift(secret: string, token: string, maxDriftSteps: number = 1, timestampMs: number = Date.now()): TotpValidationResult {
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
