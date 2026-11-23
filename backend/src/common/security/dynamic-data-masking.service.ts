import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { MaskedRecord, MaskingConfig } from './dynamic-data-masking.types';

@Injectable()
export class DynamicDataMaskingService {
  private readonly logger = new Logger(DynamicDataMaskingService.name);
  private readonly key: Buffer;

  constructor(config?: MaskingConfig) {
    this.key = config?.aesKeyHex ? Buffer.from(config.aesKeyHex, 'hex') : crypto.randomBytes(32);
  }

  public maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return '***@***.com';
    const user = parts[0];
    const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : '***';
    return `${maskedUser}@${parts[1]}`;
  }

  public tokenizeAndEncrypt(pii: string): MaskedRecord {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    let encrypted = cipher.update(pii, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return {
      plaintextMasked: this.maskEmail(pii),
      tokenCiphertext: `${encrypted}:${tag}`,
      ivHex: iv.toString('hex'),
    };
  }

  public detokenize(record: MaskedRecord): string {
    const [cipherText, tagHex] = record.tokenCiphertext.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, Buffer.from(record.ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
