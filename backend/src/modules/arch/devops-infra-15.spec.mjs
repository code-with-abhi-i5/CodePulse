import assert from 'node:assert/strict';
import { CiCacheCoordinatorService } from './devops-infra-15.service.ts';

const cacheCoord = new CiCacheCoordinatorService();

const key = cacheCoord.generateCacheKey('linux', 'pnpm', 'a1b2c3d4');
assert.strictEqual(key, 'cache-linux-pnpm-a1b2c3d4');

cacheCoord.put(key, 500000000);
const entry = cacheCoord.get(key);
assert.ok(entry);
assert.strictEqual(entry.hitCount, 1);
assert.strictEqual(cacheCoord.getTotalSize(), 500000000);

console.log('Issue #3095 [DEVOPS-INFRA-15] spec passed successfully.');
