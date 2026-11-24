import { Injectable, Logger } from '@nestjs/common';

export type BracketType = 'WINNERS' | 'LOSERS' | 'FINALS';

export interface BracketMatch {
  matchId: string;
  bracket: BracketType;
  round: number;
  matchNumber: number;
  player1Id?: string;
  player2Id?: string;
  winnerId?: string;
  loserId?: string;
  nextWinnerMatchId?: string;
  nextLoserMatchId?: string;
  isCompleted: boolean;
}

export interface TournamentBracketState {
  tournamentId: string;
  participantCount: number;
  matches: Map<string, BracketMatch>;
  winnersBracketRounds: number;
  losersBracketRounds: number;
  grandFinalsMatchId: string;
  bracketResetMatchId?: string;
  isCompleted: boolean;
  championId?: string;
}

@Injectable()
export class TournamentBracketService {
  private readonly logger = new Logger(TournamentBracketService.name);

  /**
   * Generates a complete Double-Elimination bracket tree with Winners and Losers brackets.
   * Supports standard Power-of-Two bracket seeding (e.g. 8, 16, 32, 64, up to 10,000+ seeds).
   */
  public generateDoubleEliminationBracket(
    tournamentId: string,
    seededPlayerIds: string[],
  ): TournamentBracketState {
    const rawCount = seededPlayerIds.length;
    // Calculate smallest power of 2 >= rawCount
    let bracketSize = 2;
    while (bracketSize < rawCount) {
      bracketSize *= 2;
    }

    const winnersRounds = Math.log2(bracketSize);
    const losersRounds = (winnersRounds - 1) * 2;
    const matches = new Map<string, BracketMatch>();

    // Pad players with byes if not full power of 2
    const players: Array<string | undefined> = [...seededPlayerIds];
    while (players.length < bracketSize) {
      players.push(undefined);
    }

    // Standard Tournament Seeding arrangement (1 vs N, 2 vs N-1)
    const seededMatches = this.generateSeedingOrder(bracketSize);

    // 1. Generate Winners Bracket Round 1
    for (let m = 0; m < bracketSize / 2; m++) {
      const p1Index = seededMatches[m][0] - 1;
      const p2Index = seededMatches[m][1] - 1;
      const matchId = `WB-R1-M${m + 1}`;

      const match: BracketMatch = {
        matchId,
        bracket: 'WINNERS',
        round: 1,
        matchNumber: m + 1,
        player1Id: players[p1Index],
        player2Id: players[p2Index],
        isCompleted: false,
      };

      // If one player has a bye (undefined), auto-advance player1
      if (match.player1Id && !match.player2Id) {
        match.winnerId = match.player1Id;
        match.isCompleted = true;
      }

      matches.set(matchId, match);
    }

    // 2. Generate Subsequent Winners Bracket Rounds
    for (let r = 2; r <= winnersRounds; r++) {
      const matchCount = bracketSize / Math.pow(2, r);
      for (let m = 1; m <= matchCount; m++) {
        const matchId = `WB-R${r}-M${m}`;
        matches.set(matchId, {
          matchId,
          bracket: 'WINNERS',
          round: r,
          matchNumber: m,
          isCompleted: false,
        });

        // Link previous round winners
        const prev1 = matches.get(`WB-R${r - 1}-M${(m - 1) * 2 + 1}`);
        const prev2 = matches.get(`WB-R${r - 1}-M${(m - 1) * 2 + 2}`);
        if (prev1) prev1.nextWinnerMatchId = matchId;
        if (prev2) prev2.nextWinnerMatchId = matchId;
      }
    }

    // 3. Generate Losers Bracket Rounds
    let currentLosersMatches = bracketSize / 4;
    for (let r = 1; r <= losersRounds; r++) {
      for (let m = 1; m <= currentLosersMatches; m++) {
        const matchId = `LB-R${r}-M${m}`;
        matches.set(matchId, {
          matchId,
          bracket: 'LOSERS',
          round: r,
          matchNumber: m,
          isCompleted: false,
        });

        if (r > 1 && r % 2 === 1) {
          const prev = matches.get(`LB-R${r - 1}-M${m}`);
          if (prev) prev.nextWinnerMatchId = matchId;
        }
      }

      // Halve match count every even round in Losers bracket
      if (r % 2 === 0) {
        currentLosersMatches /= 2;
      }
    }

    // 4. Grand Finals Match
    const grandFinalsMatchId = 'GF-M1';
    matches.set(grandFinalsMatchId, {
      matchId: grandFinalsMatchId,
      bracket: 'FINALS',
      round: 1,
      matchNumber: 1,
      isCompleted: false,
    });

    // 5. Grand Finals Bracket Reset Match (if Losers champion wins match 1)
    const bracketResetMatchId = 'GF-M2-RESET';
    matches.set(bracketResetMatchId, {
      matchId: bracketResetMatchId,
      bracket: 'FINALS',
      round: 2,
      matchNumber: 2,
      isCompleted: false,
    });

    return {
      tournamentId,
      participantCount: rawCount,
      matches,
      winnersBracketRounds: winnersRounds,
      losersBracketRounds: losersRounds,
      grandFinalsMatchId,
      bracketResetMatchId,
      isCompleted: false,
    };
  }

  /**
   * Generates optimal seeding pairs for tournament brackets (e.g. 1 vs 16, 8 vs 9, etc.)
   */
  private generateSeedingOrder(size: number): Array<[number, number]> {
    let rounds = Math.log2(size) - 1;
    let pls = [1, 2];

    for (let i = 0; i < rounds; i++) {
      const nextPls: number[] = [];
      const currentLength = pls.length * 2 + 1;
      for (const p of pls) {
        nextPls.push(p);
        nextPls.push(currentLength - p);
      }
      pls = nextPls;
    }

    const pairs: Array<[number, number]> = [];
    for (let i = 0; i < pls.length; i += 2) {
      pairs.push([pls[i], pls[i + 1]]);
    }
    return pairs;
  }

  /**
   * Records match outcome and advances winners and losers along the tournament tree.
   */
  public reportMatchResult(
    state: TournamentBracketState,
    matchId: string,
    winnerId: string,
  ): TournamentBracketState {
    const match = state.matches.get(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found in tournament bracket`);
    }

    if (match.player1Id !== winnerId && match.player2Id !== winnerId) {
      throw new Error(`Winner ${winnerId} is not a competitor in match ${matchId}`);
    }

    const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
    match.winnerId = winnerId;
    match.loserId = loserId;
    match.isCompleted = true;

    // Handle Grand Finals logic
    if (match.matchId === state.grandFinalsMatchId) {
      // If winners bracket champ wins, tournament is won!
      // In double-elimination: if player1 was WB champ and won, no reset needed.
      if (match.player1Id === winnerId) {
        state.isCompleted = true;
        state.championId = winnerId;
        this.logger.log(`Tournament ${state.tournamentId} completed! Champion: ${winnerId}`);
      } else {
        // Losers bracket champ won! Trigger Grand Finals Bracket Reset Match (GF-M2)
        const resetMatch = state.matches.get(state.bracketResetMatchId!);
        if (resetMatch) {
          resetMatch.player1Id = match.player1Id;
          resetMatch.player2Id = match.player2Id;
        }
      }
      return state;
    }

    if (match.matchId === state.bracketResetMatchId) {
      state.isCompleted = true;
      state.championId = winnerId;
      this.logger.log(`Tournament ${state.tournamentId} completed via bracket reset! Champion: ${winnerId}`);
      return state;
    }

    // Advance winner to next match if configured
    if (match.nextWinnerMatchId) {
      const nextMatch = state.matches.get(match.nextWinnerMatchId);
      if (nextMatch) {
        if (!nextMatch.player1Id) {
          nextMatch.player1Id = winnerId;
        } else if (!nextMatch.player2Id) {
          nextMatch.player2Id = winnerId;
        }
      }
    }

    // Advance loser to losers bracket match if configured
    if (match.nextLoserMatchId && loserId) {
      const loserMatch = state.matches.get(match.nextLoserMatchId);
      if (loserMatch) {
        if (!loserMatch.player1Id) {
          loserMatch.player1Id = loserId;
        } else if (!loserMatch.player2Id) {
          loserMatch.player2Id = loserId;
        }
      }
    }

    return state;
  }
}
