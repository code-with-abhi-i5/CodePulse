import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DarkThemeSubmissionSanitizer } from './dark-submission-sanitizer.service.ts';

describe('DarkThemeSubmissionSanitizer [L2-ERROR-RETRY-OFFLINE-025]', () => {
  const san = new DarkThemeSubmissionSanitizer();

  test('sanitizes input and returns dark high-contrast code block theme', () => {
    assert.equal(san.sanitize('test<script>bad()</script>'), 'test');
    const styles = san.getCodeBlockStyles();
    assert.equal(styles.background, '#0B0F19');
    assert.equal(styles.color, '#E2E8F0');
  });
});
