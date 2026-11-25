import assert from 'node:assert/strict';
import { RedisHashSlidingWindowRateLimiterService } from './perf-scale-40.service.ts';

const limiter = new RedisHashSlidingWindowRateLimiterService(3, 10);

const now = 1000000;
const d1 = limiter.recordRequest('user-1', now);
assert.strictEqual(d1.allowed, true);
assert.strictEqual(d1.remaining, 2);

const d2 = limiter.recordRequest('user-1', now + 1000);
assert.strictEqual(d2.allowed, true);

const d3 = limiter.recordRequest('user-1', now + 2000);
assert.strictEqual(d3.allowed, true);
assert.strictEqual(d3.remaining, 0);

const d4 = limiter.recordRequest('user-1', now + 3000);
assert.strictEqual(d4.allowed, false);

const d5 = limiter.recordRequest('user-1', now + 11000);
assert.strictEqual(d5.allowed, true);

console.log('Issue #3075 [PERF-SCALE-40] spec passed successfully.');
