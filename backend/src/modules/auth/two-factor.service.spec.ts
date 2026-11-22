import { TwoFactorService } from './two-factor.service';

describe('TwoFactorService (#309 RFC 6238 TOTP Engine & Recovery Codes)', () => {
  let service: TwoFactorService;

  beforeEach(() => {
    service = new TwoFactorService();
  });

  describe('RFC 4648 Base32 Encoding & Decoding', () => {
    it('accurately encodes and decodes buffers without data loss', () => {
      const original = Buffer.from('HelloWorld12345!@#', 'utf8');
      const base32 = service.encodeBase32(original);

      expect(typeof base32).toBe('string');
      expect(base32.length).toBeGreaterThan(0);

      const decoded = service.decodeBase32(base32);
      expect(decoded.equals(original)).toBe(true);
    });

    it('handles padding and lowercase letters gracefully', () => {
      const buf = Buffer.from('CodePulseSec', 'utf8');
      const encoded = service.encodeBase32(buf);
      const lowerWithSpaces = `  ${encoded.toLowerCase()}  `;

      const decoded = service.decodeBase32(lowerWithSpaces);
      expect(decoded.equals(buf)).toBe(true);
    });
  });

  describe('RFC 6238 Standard Test Vectors', () => {
    // Mode: SHA1, Secret: "12345678901234567890" (in ASCII) -> Base32: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ
    const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

    it('matches official RFC 6238 test vectors at defined timestamps', () => {
      // T = 1 (time = 59s): expected 287082
      expect(service.computeTotp(rfcSecret, 1)).toBe('287082');

      // T = 37037036 (time = 1111111109s): expected 081804
      expect(service.computeTotp(rfcSecret, 37037036)).toBe('081804');

      // T = 37037037 (time = 1111111111s): expected 050471
      expect(service.computeTotp(rfcSecret, 37037037)).toBe('050471');

      // T = 41152263 (time = 1234567890s): expected 005924
      expect(service.computeTotp(rfcSecret, 41152263)).toBe('005924');

      // T = 66666666 (time = 2000000000s): expected 279037
      expect(service.computeTotp(rfcSecret, 66666666)).toBe('279037');
    });

    it('verifies TOTP passcodes within the ±30s drift window', () => {
      const currentStep = Math.floor(Date.now() / 1000 / 30);
      const validCode = service.computeTotp(rfcSecret, currentStep);

      expect(service.verifyTotp(rfcSecret, validCode)).toBe(true);

      // Previous step (drift of -30s)
      const prevCode = service.computeTotp(rfcSecret, currentStep - 1);
      expect(service.verifyTotp(rfcSecret, prevCode)).toBe(true);

      // Next step (drift of +30s)
      const nextCode = service.computeTotp(rfcSecret, currentStep + 1);
      expect(service.verifyTotp(rfcSecret, nextCode)).toBe(true);

      // Expired code outside window (2 steps ago)
      const expiredCode = service.computeTotp(rfcSecret, currentStep - 3);
      expect(service.verifyTotp(rfcSecret, expiredCode)).toBe(false);

      // Rejects invalid codes
      expect(service.verifyTotp(rfcSecret, '000000')).toBe(false);
      expect(service.verifyTotp(rfcSecret, 'abc123')).toBe(false);
    });
  });

  describe('Secret Generation & QR Code Data URL', () => {
    it('generates a cryptographically secure 32-char base32 secret and valid QR data URL', async () => {
      const res = await service.generateSecret('developer@codepulse.io', 'CodePulse');

      expect(res.secret).toHaveLength(32);
      expect(/^[A-Z2-7]+$/.test(res.secret)).toBe(true);
      expect(res.otpauthUrl).toContain('otpauth://totp/CodePulse:developer%40codepulse.io');
      expect(res.otpauthUrl).toContain(`secret=${res.secret}`);
      expect(res.qrCodeDataUrl).toMatch(/^data:image\/(png|svg\+xml);/);
    });
  });

  describe('Encryption at Rest (AES-256-GCM)', () => {
    it('encrypts secret at rest and decrypts accurately in memory', () => {
      const secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
      const encrypted = service.encryptSecret(secret);

      // Format iv:tag:cipher in hex
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      expect(encrypted).not.toContain(secret);

      const decrypted = service.decryptSecret(encrypted);
      expect(decrypted).toBe(secret);
    });

    it('rejects tampered encrypted payloads', () => {
      const secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
      const encrypted = service.encryptSecret(secret);
      const parts = encrypted.split(':');

      // Tamper with ciphertext
      const tampered = `${parts[0]}:${parts[1]}:deadbeef${parts[2]}`;
      expect(() => service.decryptSecret(tampered)).toThrow();
    });
  });

  describe('Emergency Backup Recovery Codes', () => {
    it('generates 10 single-use emergency backup recovery codes with hashed representations', () => {
      const { codes, hashedCodes } = service.generateRecoveryCodes(10);

      expect(codes).toHaveLength(10);
      expect(hashedCodes).toHaveLength(10);

      codes.forEach((code, idx) => {
        expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
        expect(hashedCodes[idx]).toBe(service.hashRecoveryCode(code));
      });
    });

    it('verifies and redeems single-use recovery code and returns remaining hashes', () => {
      const { codes, hashedCodes } = service.generateRecoveryCodes(5);
      const codeToRedeem = codes[2];

      const res = service.verifyAndRedeemRecoveryCode(codeToRedeem, hashedCodes);
      expect(res.valid).toBe(true);
      expect(res.remainingHashedCodes).toHaveLength(4);
      expect(res.remainingHashedCodes).not.toContain(service.hashRecoveryCode(codeToRedeem));

      // Attempting to redeem the same code a second time must fail
      const secondAttempt = service.verifyAndRedeemRecoveryCode(codeToRedeem, res.remainingHashedCodes);
      expect(secondAttempt.valid).toBe(false);
      expect(secondAttempt.remainingHashedCodes).toHaveLength(4);
    });
  });
});

