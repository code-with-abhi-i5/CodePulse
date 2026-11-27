import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WcagSubmissionHtmlSanitizer } from './wcag-submission-sanitizer.service.ts';

describe('WcagSubmissionHtmlSanitizer [L2-ERROR-RETRY-OFFLINE-035]', () => {
  const sanitizer = new WcagSubmissionHtmlSanitizer();

  test('ensures images in submissions comply with WCAG alt attribute standards', () => {
    const res = sanitizer.cleanAndValidateA11y('<p>Diagram:</p><img src="diagram.png">');
    assert.ok(res.cleanHtml.includes('alt='));
    assert.equal(res.hasAltForImages, true);
  });
});
