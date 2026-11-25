import assert from 'node:assert/strict';
import { HighSpeedRegexMatcherService } from './perf-scale-35.service.ts';

const matcher = new HighSpeedRegexMatcherService();

assert.strictEqual(matcher.isPatternSafe('^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$'), true);
assert.strictEqual(matcher.isPatternSafe('(a+)+'), false);

matcher.register('email', '^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$');
matcher.register('hashTag', '#[a-zA-Z0-9_]+', 'g');

const res1 = matcher.match('hashTag', 'Check this #codepulse #optimization challenge');
assert.strictEqual(res1.matched, true);
assert.strictEqual(res1.matches.length, 2);
assert.strictEqual(res1.matches[0], '#codepulse');

const p = matcher.getPattern('hashTag');
assert.strictEqual(p.matchCount, 1);
assert.strictEqual(p.isSafeDfa, true);

console.log('Issue #3070 [PERF-SCALE-35] spec passed successfully.');
