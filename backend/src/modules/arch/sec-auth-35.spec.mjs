import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { XxeInjectionGuardService } from './sec-auth-35.service.ts';

describe('XxeInjectionGuardService (SEC-AUTH-35)', () => {
  it('blocks external DTD entity injections and strips DOCTYPE blocks safely', () => {
    const guard = new XxeInjectionGuardService();

    const xxePayload = `<?xml version="1.0"?>
    <!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
    <data>&xxe;</data>`;

    const badRes = guard.sanitizeXml(xxePayload);
    assert.strictEqual(badRes.isSafe, false);
    assert.ok(badRes.error.includes('External DTD entity declarations'));

    const safeXml = '<?xml version="1.0"?><note><to>User</to></note>';
    const goodRes = guard.sanitizeXml(safeXml);
    assert.strictEqual(goodRes.isSafe, true);
    assert.ok(goodRes.sanitizedXml.includes('<note><to>User</to></note>'));
  });
});
