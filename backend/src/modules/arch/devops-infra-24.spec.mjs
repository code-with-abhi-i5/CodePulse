import assert from 'node:assert/strict';
import { GitSecretScrubberService } from './devops-infra-24.service.ts';

const scrubber = new GitSecretScrubberService();

const cleanDiff = `
+ const dbHost = process.env.DB_HOST;
+ const port = 3000;
`;
assert.strictEqual(scrubber.scanContent(cleanDiff).leakFound, false);

const leakedDiff = `
+ const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
`;
const res = scrubber.scanContent(leakedDiff);
assert.strictEqual(res.leakFound, true);
assert.strictEqual(res.ruleName, 'GITHUB_PAT');

console.log('Issue #3104 [DEVOPS-INFRA-24] spec passed successfully.');
