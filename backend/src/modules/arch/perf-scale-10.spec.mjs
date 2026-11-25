import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RedisSkipListLeaderboardService } from './perf-scale-10.service.ts';

describe('RedisSkipListLeaderboardService (PERF-SCALE-10)', () => {
  it('ranks players by descending score with tie-breaking on timestamp', () => {
    const lb = new RedisSkipListLeaderboardService();
    lb.zadd('alice', 100, 1000);
    lb.zadd('bob', 120, 1000);
    lb.zadd('charlie', 100, 500); // Same score as alice, earlier timestamp

    assert.strictEqual(lb.zrevrank('bob'), 0);
    assert.strictEqual(lb.zrevrank('charlie'), 1);
    assert.strictEqual(lb.zrevrank('alice'), 2);

    const top2 = lb.zrevrange(0, 1);
    assert.strictEqual(top2.length, 2);
    assert.strictEqual(top2[0].userId, 'bob');
    assert.strictEqual(top2[1].userId, 'charlie');
  });
});
