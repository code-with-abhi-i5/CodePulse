import assert from 'node:assert/strict';
import { GitPreCommitHookEnforcerService } from './devops-infra-12.service.ts';

const enforcer = new GitPreCommitHookEnforcerService();

const v1 = enforcer.validateCommitMessage('feat(auth): add OAuth2 refresh token handling');
assert.strictEqual(v1.isValid, true);
assert.strictEqual(v1.type, 'feat');
assert.strictEqual(v1.scope, 'auth');

const v2 = enforcer.validateCommitMessage('fixed something');
assert.strictEqual(v2.isValid, false);
assert.ok(v2.error.includes('conventional format'));

const v3 = enforcer.validateCommitMessage('random(scope): do stuff');
assert.strictEqual(v3.isValid, false);
assert.ok(v3.error.includes('Invalid commit type'));

console.log('Issue #3092 [DEVOPS-INFRA-12] spec passed successfully.');
