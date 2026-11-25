import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VirtualizedLeaderboardTableService } from './fe-ui-14.service.ts';

describe('VirtualizedLeaderboardTableService (FE-UI-14)', () => {
  it('computes virtualized window slice and offset for 10k leaderboard rows', () => {
    const service = new VirtualizedLeaderboardTableService(40, 400); // 10 rows visible
    const entries = Array.from({ length: 1000 }, (_, i) => ({
      rank: i + 1,
      userId: `usr_${i}`,
      username: `user${i}`,
      rating: 2000 - i
    }));

    // Scrolled to 800px = row index 20
    const win = service.sliceRows(entries, 800);
    assert.strictEqual(win.offsetY, 800);
    assert.strictEqual(win.rows[0].rank, 21);
    assert.ok(win.rows.length <= 15);
  });
});
