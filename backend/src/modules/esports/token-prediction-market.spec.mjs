import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class TokenPredictionMarketService {
  constructor() {
    this.markets = new Map();
  }

  placeBet(marketId, bet) {
    const bets = this.markets.get(marketId) || [];
    bets.push(bet);
    this.markets.set(marketId, bets);
  }

  settleMarket(marketId, winningOutcome) {
    const bets = this.markets.get(marketId) || [];
    const totalPool = bets.reduce((acc, b) => acc + b.amount, 0);
    const winningBets = bets.filter(b => b.outcome === winningOutcome);
    const winningPool = winningBets.reduce((acc, b) => acc + b.amount, 0);

    const payouts = {};
    if (winningPool > 0) {
      for (const bet of winningBets) {
        const share = (bet.amount / winningPool) * totalPool;
        payouts[bet.userId] = Math.round(share);
      }
    }
    this.markets.delete(marketId);
    return { winningOutcome, totalPool, payouts };
  }
}

describe('TokenPredictionMarketService', () => {
  it('places prediction bets and calculates parimutuel payouts to winners', () => {
    const market = new TokenPredictionMarketService();
    market.placeBet('m-001', { userId: 'alice', outcome: 'player1', amount: 100 });
    market.placeBet('m-001', { userId: 'bob', outcome: 'player2', amount: 300 });

    const settlement = market.settleMarket('m-001', 'player1');
    assert.strictEqual(settlement.totalPool, 400);
    assert.strictEqual(settlement.payouts['alice'], 400);
    assert.strictEqual(settlement.payouts['bob'], undefined);
  });
});
