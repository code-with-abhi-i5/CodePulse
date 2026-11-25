import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiPayloadSanitizerService } from './api-int-11.service.ts';

describe('ApiPayloadSanitizerService (API-INT-11)', () => {
  it('strips dangerous prototype pollution keys recursively from incoming payloads', () => {
    const sanitizer = new ApiPayloadSanitizerService();
    const malicious = JSON.parse('{"validKey":"value","__proto__":{"isAdmin":true},"nested":{"constructor":"hack","item":123}}');

    assert.strictEqual(sanitizer.hasPollutionThreat(malicious), true);
    const cleaned = sanitizer.sanitize(malicious);
    assert.strictEqual(cleaned.validKey, 'value');
    assert.strictEqual(cleaned.nested.item, 123);
    assert.strictEqual(cleaned.__proto__, undefined);
    assert.strictEqual(cleaned.nested.constructor, undefined);
  });
});
