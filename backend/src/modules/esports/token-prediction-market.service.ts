import { Injectable } from '@nestjs/common';
import { BetRecord, MarketSettlement } from '../../types/esports';

@Injectable()
export class TokenPredictionMarketService {
  private markets: Map<string, BetRecord[]> = new Map();

  placeBet(marketId: string, bet: BetRecord): void {
    const bets = this.markets.get(marketId) || [];
    bets.push(bet);
    this.markets.set(marketId, bets);
  }

  settleMarket(marketId: string, winningOutcome: 'player1' | 'player2'): MarketSettlement {
    const bets = this.markets.get(marketId) || [];
    const totalPool = bets.reduce((acc, b) => acc + b.amount, 0);
    const winningBets = bets.filter(b => b.outcome === winningOutcome);
    const winningPool = winningBets.reduce((acc, b) => acc + b.amount, 0);

    const payouts: Record<string, number> = {};
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
