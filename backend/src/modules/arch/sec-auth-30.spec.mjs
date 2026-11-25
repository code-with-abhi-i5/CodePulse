import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CorsOriginRegexValidatorService } from './sec-auth-30.service.ts';

describe('CorsOriginRegexValidatorService (SEC-AUTH-30)', () => {
  it('validates authentic origins and strictly blocks deceptive domain takeover attacks', () => {
    const validator = new CorsOriginRegexValidatorService();

    assert.strictEqual(validator.validateOrigin('https://codepulse.io'), true);
    assert.strictEqual(validator.validateOrigin('https://app.codepulse.io'), true);

    // Deceptive prefix / suffix attacks
    assert.strictEqual(validator.validateOrigin('https://attacker-codepulse.io'), false);
    assert.strictEqual(validator.validateOrigin('https://codepulse.io.evil.com'), false);
    assert.strictEqual(validator.validateOrigin('http://codepulse.io'), false); // reject insecure HTTP
  });
});
