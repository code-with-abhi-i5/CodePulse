import { TokenPredictionMarketService } from './token-prediction-market.service';

describe('TokenPredictionMarketService', () => {
  let service: TokenPredictionMarketService;
  beforeEach(() => { service = new TokenPredictionMarketService(); });
  it('settles empty market', () => {
    const res = service.settleMarket('m1', 'player1');
    expect(res.totalPool).toBe(0);
  });
});
