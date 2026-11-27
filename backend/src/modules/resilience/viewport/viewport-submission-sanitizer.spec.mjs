import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportSubmissionSanitizer } from './viewport-submission-sanitizer.service.ts';

test('ViewportSubmissionSanitizer [L2-ERROR-RETRY-OFFLINE-015]', async (t) => {
  await t.test('strips HTML and truncates long lines for small viewports', () => {
    const sanitizer = new ViewportSubmissionSanitizer();
    const raw = '<script>alert(1)</script><p>' + 'A'.repeat(120) + '</p>';
    const formatted = sanitizer.sanitizeAndFormatCode(raw, 50);
    assert.equal(formatted.includes('<script>'), false);
    assert.equal(formatted.includes('<p>'), false);
    assert.equal(formatted.endsWith('...'), true);
  });
});
