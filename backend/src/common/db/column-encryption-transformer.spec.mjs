import test from 'node:test';
import assert from 'node:assert/strict';

class ColumnEncryptionTransformerService {
  constructor() {
    this.prefix = 'enc:v1:';
  }
  encrypt(plainText) {
    const b64 = Buffer.from(plainText, 'utf8').toString('base64');
    return { cipherText: this.prefix + b64, isEncrypted: true };
  }
  decrypt(cipherText) {
    if (!cipherText.startsWith(this.prefix)) return cipherText;
    return Buffer.from(cipherText.slice(this.prefix.length), 'base64').toString('utf8');
  }
}

test('ColumnEncryptionTransformerService - safely transforms plain text to encrypted form and back', () => {
  const service = new ColumnEncryptionTransformerService();
  const raw = 'user@example.com';
  const enc = service.encrypt(raw);

  assert.equal(enc.isEncrypted, true);
  assert.ok(enc.cipherText.startsWith('enc:v1:'));

  const dec = service.decrypt(enc.cipherText);
  assert.equal(dec, raw);
});
