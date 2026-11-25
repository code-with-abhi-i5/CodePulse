import assert from 'node:assert/strict';
import { SessionCompactionCleanerService } from './perf-scale-38.service.ts';

const cleaner = new SessionCompactionCleanerService();

const now = 100000;
cleaner.setSession('t1', 'u1', 500, now);
cleaner.setSession('t2', 'u2', 2000, now);
cleaner.setSession('t3', 'u3', 300, now);

assert.strictEqual(cleaner.size(), 3);

const report = cleaner.compactExpiredSessions(10, 101000);
assert.strictEqual(report.deleted, 2);
assert.strictEqual(report.retained, 1);
assert.strictEqual(cleaner.getSession('t2', 101000) !== null, true);
assert.strictEqual(cleaner.getSession('t1', 101000), null);

console.log('Issue #3073 [PERF-SCALE-38] spec passed successfully.');
