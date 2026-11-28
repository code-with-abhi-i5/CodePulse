import test from 'node:test';
import assert from 'node:assert/strict';
import { ChallengeHtmlSanitizer } from './challenge-html-sanitizer.service.ts';

test('ChallengeHtmlSanitizer [L2-ERROR-RETRY-OFFLINE-005]', async (t) => {
  const sanitizer = new ChallengeHtmlSanitizer();

  await t.test('strips dangerous script tags and inline event handlers', () => {
    const raw = '<script>alert("hack")</script><p onclick="steal()">Hello</p>';
    const cleaned = sanitizer.sanitizeSubmission(raw);
    assert.equal(cleaned.includes('<script>'), false);
    assert.equal(cleaned.includes('onclick'), false);
    assert.equal(cleaned.includes('Hello'), true);
  });

  await t.test('blocks javascript: URI schemes and embedded iframes', () => {
    const raw = '<a href="javascript:void(0)">Click</a><iframe src="evil.com"></iframe>';
    const cleaned = sanitizer.sanitizeSubmission(raw);
    assert.equal(cleaned.includes('javascript:'), false);
    assert.equal(cleaned.includes('blocked:'), true);
    assert.equal(cleaned.includes('<iframe'), false);
  });

  await t.test('escapes special characters for safe text insertion', () => {
    const escaped = sanitizer.escapeSpecialChars('<h1>"Bob & Alice"</h1>');
    assert.equal(escaped, '&lt;h1&gt;&quot;Bob &amp; Alice&quot;&lt;/h1&gt;');
    assert.equal(sanitizer.escapeSpecialChars(''), '');
  });
});
