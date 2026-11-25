import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiPayloadDesanitizationGuardService } from './sec-auth-49.service.ts';

describe('ApiPayloadDesanitizationGuardService (SEC-AUTH-49)', () => {
  it('detects and blocks prototype pollution attempts in nested JSON payloads', () => {
    const guard = new ApiPayloadDesanitizationGuardService();
    const malicious = JSON.parse('{"title":"test", "__proto__": {"isAdmin": true}}');

    const res = guard.sanitizeAndValidatePayload(malicious);
    assert.strictEqual(res.safe, false);
    assert.match(res.error, /Prototype pollution attempt detected/i);
  });

  it('sanitizes nested script injection strings while preserving legitimate fields', () => {
    const guard = new ApiPayloadDesanitizationGuardService();
    const payload = {
      user: {
        bio: 'Hello <script>alert("xss")</script> World!',
        age: 25
      }
    };

    const res = guard.sanitizeAndValidatePayload(payload);
    assert.strictEqual(res.safe, true);
    assert.strictEqual(res.sanitizedPayload.user.bio, 'Hello  World!');
    assert.strictEqual(res.sanitizedPayload.user.age, 25);
  });
});
