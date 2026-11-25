import { GuildLeaderboardAccumulatorService } from './guild-leaderboard-accumulator.service';

describe('GuildLeaderboardAccumulatorService', () => {
  let service: GuildLeaderboardAccumulatorService;
  beforeEach(() => { service = new GuildLeaderboardAccumulatorService(); });
  it('aggregates guild scores', () => {
    const res = service.aggregateGuildScores('g1', []);
    expect(res.totalScore).toBe(0);
  });
});
