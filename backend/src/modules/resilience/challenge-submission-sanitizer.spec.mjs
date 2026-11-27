import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ChallengeSubmissionSanitizerService } from './challenge-submission-sanitizer.service.ts';

describe('ChallengeSubmissionSanitizerService [L2-ERROR-RETRY-OFFLINE-055]', () => {
  const sanitizer = new ChallengeSubmissionSanitizerService();

  test('removes malicious script tags and inline event handlers', () => {
    const dirty = '<p>Solution</p><script>alert("hacked")</script><img src="x" onerror="stealCookies()">';
    const clean = sanitizer.sanitize(dirty);
    assert.ok(!clean.includes('<script>'));
    assert.ok(!clean.includes('onerror'));
    assert.ok(clean.includes('<p>Solution</p>'));
  });

  test('retains safe markup while injecting noopener noreferrer on links', () => {
    const input = 'Check documentation <a href="https://example.com">here</a>.';
    const clean = sanitizer.sanitize(input);
    assert.ok(clean.includes('rel="noopener noreferrer"'));
    assert.ok(clean.includes('href="https://example.com"'));
  });

  test('handles empty and whitespace input cleanly', () => {
    assert.equal(sanitizer.sanitize(''), '');
    assert.equal(sanitizer.sanitize('   '), '');
  });
});
