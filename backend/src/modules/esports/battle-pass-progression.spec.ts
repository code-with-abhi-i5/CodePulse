import { BattlePassProgressionService } from './battle-pass-progression.service';

describe('BattlePassProgressionService', () => {
  let service: BattlePassProgressionService;
  beforeEach(() => { service = new BattlePassProgressionService(); });
  it('calculates tier progress', () => {
    const res = service.calculateTierProgress(1500, 1000);
    expect(res.tier).toBe(2);
  });
});
