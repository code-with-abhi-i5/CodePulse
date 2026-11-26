import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ConstantTimeHmacService {
  signPayload(secret: string, payload: string | Buffer): string {
    const data = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  verifySignature(secret: string, payload: string | Buffer, providedSignature: string): boolean {
    const expected = this.signPayload(secret, payload);
    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(providedSignature, 'hex');

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  }
}
