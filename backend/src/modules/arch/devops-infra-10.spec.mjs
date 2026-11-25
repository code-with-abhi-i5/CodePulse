import assert from 'node:assert/strict';
import { ZeroDowntimeMigrationRunnerService } from './devops-infra-10.service.ts';

const runner = new ZeroDowntimeMigrationRunnerService();

const safeSql = `
ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL;
CREATE INDEX idx_users_phone ON users (phone);
`;
const safeRes = runner.analyzeMigration('20261125_add_phone', safeSql);
assert.strictEqual(safeRes.isBackwardCompatible, true);
assert.strictEqual(safeRes.violations.length, 0);

const breakingSql = `
ALTER TABLE users DROP COLUMN legacy_bio;
ALTER TABLE orders ADD COLUMN status VARCHAR(20) NOT NULL;
`;
const breakingRes = runner.analyzeMigration('20261125_breaking', breakingSql);
assert.strictEqual(breakingRes.isBackwardCompatible, false);
assert.strictEqual(breakingRes.violations.length, 2);

console.log('Issue #3090 [DEVOPS-INFRA-10] spec passed successfully.');
