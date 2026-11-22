import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly encryptionKey: Buffer;

  constructor() {
    // 256-bit AES-GCM encryption key derived from environment or secure default
    const secretSeed =
      process.env.TWO_FACTOR_ENCRYPTION_KEY ||
      process.env.JWT_SECRET ||
      'codepulse-totp-encryption-secret-default-key-32';
    this.encryptionKey = crypto.createHash('sha256').update(secretSeed).digest();
  }

  // ---------------------------------------------------------------------------
  // Base32 RFC 4648 Encoding & Decoding
  // ---------------------------------------------------------------------------

  public encodeBase32(buffer: Buffer): string {
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;
      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }

    return output;
  }

  public decodeBase32(base32: string): Buffer {
    const cleaned = base32.toUpperCase().replace(/[\s=-]/g, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (let i = 0; i < cleaned.length; i++) {
      const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }

  // ---------------------------------------------------------------------------
  // Secret Generation & QR Code Generation (RFC 6238)
  // ---------------------------------------------------------------------------

  /**
   * Generates a 32-character base32 secret (20 random bytes), otpauth URI, and QR code data URL.
   */
  async generateSecret(
    usernameOrEmail: string,
    issuer = 'CodePulse',
  ): Promise<{
    secret: string;
    otpauthUrl: string;
    qrCodeDataUrl: string;
  }> {
    // 20 bytes = 160 bits = 32 Base32 characters
    const randomBuf = crypto.randomBytes(20);
    const secret = this.encodeBase32(randomBuf);

    const safeIssuer = encodeURIComponent(issuer);
    const safeAccount = encodeURIComponent(usernameOrEmail);
    const otpauthUrl = `otpauth://totp/${safeIssuer}:${safeAccount}?secret=${secret}&issuer=${safeIssuer}&algorithm=SHA1&digits=6&period=30`;

    let qrCodeDataUrl = '';
    try {
      // Use dynamic require so bundling is seamless
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const QRCode = require('qrcode');
      qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'M',
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (err: any) {
      this.logger.debug(`qrcode package dynamic require fallback: ${err.message}`);
      // Fallback SVG data URL
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><text x="100" y="100" font-size="12" text-anchor="middle" fill="#000">${secret}</text></svg>`;
      qrCodeDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl,
    };
  }

  // ---------------------------------------------------------------------------
  // Secret Encryption at Rest (AES-256-GCM)
  // ---------------------------------------------------------------------------

  /**
   * Encrypts plaintext base32 TOTP secret with AES-256-GCM before storing in PostgreSQL.
   */
  public encryptSecret(plainSecret: string): string {
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(plainSecret, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all in hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypts encrypted TOTP secret retrieved from PostgreSQL into clear base32 in ephemeral memory.
   */
  public decryptSecret(encryptedPayload: string): string {
    if (!encryptedPayload) {
      throw new BadRequestException('Empty 2FA secret payload.');
    }

    const parts = encryptedPayload.split(':');
    // If payload is not in iv:tag:cipher format, return as-is for backwards compatibility
    if (parts.length !== 3) {
      return encryptedPayload;
    }

    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  // ---------------------------------------------------------------------------
  // RFC 6238 TOTP Passcode Computation & Verification
  // ---------------------------------------------------------------------------

  /**
   * Computes the 6-digit TOTP code for a secret at a specific counter step (default = now / 30s).
   */
  public computeTotp(secret: string, timeStep?: number): string {
    const step = timeStep !== undefined ? timeStep : Math.floor(Date.now() / 1000 / 30);
    const secretBuffer = this.decodeBase32(secret);

    // 8-byte big-endian counter buffer
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeBigInt64BE(BigInt(step), 0);

    const hmac = crypto.createHmac('sha1', secretBuffer).update(counterBuf).digest();

    // RFC 4226 Dynamic Truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = code % 1000000;
    return otp.toString().padStart(6, '0');
  }

  /**
   * Verifies a 6-digit TOTP code against a secret with time drift tolerance window (±1 step = ±30s).
   */
  public verifyTotp(secret: string, passcode: string, window = 1): boolean {
    if (!passcode || !/^\d{6}$/.test(passcode.trim())) {
      return false;
    }

    const cleanCode = passcode.trim();
    const currentStep = Math.floor(Date.now() / 1000 / 30);

    // Check steps [currentStep - window, currentStep + window]
    for (let step = currentStep - window; step <= currentStep + window; step++) {
      const expected = this.computeTotp(secret, step);
      if (
        crypto.timingSafeEqual(
          Buffer.from(expected, 'utf8'),
          Buffer.from(cleanCode, 'utf8'),
        )
      ) {
        return true;
      }
    }

    return false;
  }

  // Alias for backward compatibility
  public verifyPasscode(secret: string, passcode: string): boolean {
    return this.verifyTotp(secret, passcode);
  }

  // ---------------------------------------------------------------------------
  // Emergency Backup Recovery Codes (Single-Use, Hashed)
  // ---------------------------------------------------------------------------

  /**
   * Generates 10 cryptographically random 8-character recovery codes (e.g. 7A1F-C89B)
   * and returns cleartext codes (shown to user ONCE) alongside secure SHA-256 hashes for DB storage.
   */
  public generateRecoveryCodes(count = 10): { codes: string[]; hashedCodes: string[] } {
    const codes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const code = `${part1}-${part2}`; // 8 alphanumeric characters + hyphen

      codes.push(code);
      hashedCodes.push(this.hashRecoveryCode(code));
    }

    return { codes, hashedCodes };
  }

  public hashRecoveryCode(code: string): string {
    const normalized = code.replace(/[\s-]/g, '').toUpperCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Verifies whether an input recovery code matches any of the user's stored hashed codes.
   * If matched, removes the code from the list (single-use redemption) and returns the updated array.
   */
  public verifyAndRedeemRecoveryCode(
    rawCode: string,
    storedHashedCodes: string[],
  ): { valid: boolean; remainingHashedCodes: string[] } {
    if (!rawCode || !storedHashedCodes || storedHashedCodes.length === 0) {
      return { valid: false, remainingHashedCodes: storedHashedCodes || [] };
    }

    const inputHash = this.hashRecoveryCode(rawCode);
    const index = storedHashedCodes.indexOf(inputHash);

    if (index !== -1) {
      const remainingHashedCodes = [...storedHashedCodes];
      remainingHashedCodes.splice(index, 1);
      return {
        valid: true,
        remainingHashedCodes,
      };
    }

    return {
      valid: false,
      remainingHashedCodes: storedHashedCodes,
    };
  }
}
