import assert from 'node:assert/strict';
import { SemanticReleaseWorkflowService } from './devops-infra-04.service.ts';

const releaser = new SemanticReleaseWorkflowService();

const c1 = releaser.parseCommit('feat(auth): add MFA verification flow');
assert.strictEqual(c1.type, 'feat');
assert.strictEqual(c1.scope, 'auth');
assert.strictEqual(c1.isBreaking, false);

const c2 = releaser.parseCommit('fix(api): fix null pointer on session lookup');
assert.strictEqual(c2.type, 'fix');

const v1 = releaser.calculateNextVersion('1.2.3', [c1, c2]);
assert.strictEqual(v1.nextVersion, '1.3.0');
assert.strictEqual(v1.bumpType, 'minor');

const changelog = releaser.generateChangelog('1.3.0', [c1, c2]);
assert.ok(changelog.includes('### Features'));
assert.ok(changelog.includes('**auth:** add MFA verification flow'));

console.log('Issue #3084 [DEVOPS-INFRA-04] spec passed successfully.');
