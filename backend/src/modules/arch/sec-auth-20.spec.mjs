import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { CredentialStuffingDetectorService } from './sec-auth-20.service.ts';

describe('CredentialStuffingDetectorService (SEC-AUTH-20)', () => {
  it('detects compromised passwords using k-anonymity SHA-1 prefix matching', () => {
    const detector = new CredentialStuffingDetectorService();

    // Password "password123"
    const sha1 = crypto.createHash('sha1').update('password123').digest('hex').toUpperCase();
    const prefix = sha1.substring(0, 5);

    detector.registerBreachedPrefix(prefix);

    const check1 = detector.checkPasswordCompromised('password123');
    assert.strictEqual(check1.isCompromised, true);
    assert.strictEqual(check1.sha1Prefix, prefix);

    const check2 = detector.checkPasswordCompromised('superUniqueUnbreachedPass123!');
    assert.strictEqual(check2.isCompromised, false);
  });
});
