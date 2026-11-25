import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SecureFileUploadValidatorService } from './sec-auth-37.service.ts';

describe('SecureFileUploadValidatorService (SEC-AUTH-37)', () => {
  it('validates authentic PNG magic bytes and rejects spoofed and polyglot files', () => {
    const validator = new SecureFileUploadValidatorService();

    // Authentic PNG
    const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
    assert.strictEqual(validator.validateFileBuffer(pngBuf, 'image/png').isValid, true);

    // Fake PNG (text file with PNG extension)
    const fakePng = Buffer.from('this is not a png image');
    assert.strictEqual(validator.validateFileBuffer(fakePng, 'image/png').isValid, false);

    // Polyglot PHP image
    const polyglot = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.from('<?php system($_GET["cmd"]); ?>')]);
    const polyglotRes = validator.validateFileBuffer(polyglot, 'image/png');
    assert.strictEqual(polyglotRes.isValid, false);
    assert.ok(polyglotRes.error.includes('Polyglot payload detected'));
  });
});
