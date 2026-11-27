import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SubmissionHtmlSanitizerVerifier } from './submission-sanitizer-verifier.service.ts';

describe('SubmissionHtmlSanitizerVerifier [L2-ERROR-RETRY-OFFLINE-045]', () => {
  const sanitizer = new SubmissionHtmlSanitizerVerifier();

  test('strips dangerous embedded scripts and iframe injections', () => {
    const payload = '<div>Test</div><script>document.cookie</script><iframe src="evil.com"></iframe>';
    const clean = sanitizer.sanitize(payload);
    assert.equal(clean, '<div>Test</div>');
    assert.equal(sanitizer.isSafe(clean), true);
  });
});
