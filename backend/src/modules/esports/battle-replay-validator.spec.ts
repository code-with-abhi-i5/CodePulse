import { BattleReplayValidatorService } from './battle-replay-validator.service';

describe('BattleReplayValidatorService', () => {
  let service: BattleReplayValidatorService;
  beforeEach(() => { service = new BattleReplayValidatorService(); });
  it('validates empty replay', () => {
    const res = service.validateReplay([], 'p1');
    expect(res.isValid).toBe(true);
  });
});
