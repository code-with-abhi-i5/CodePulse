import { Injectable } from '@nestjs/common';
import { TournamentMatch } from '../../types/esports';

@Injectable()
export class TournamentBracketGeneratorService {
  generateDoubleEliminationBracket(participants: string[]): TournamentMatch[] {
    const count = participants.length;
    if (count < 2) return [];

    let powerOfTwo = 2;
    while (powerOfTwo < count) powerOfTwo *= 2;

    const matches: TournamentMatch[] = [];
    const padded = [...participants];
    while (padded.length < powerOfTwo) {
      padded.push('BYE');
    }

    // Round 1 Winners Bracket
    const numMatchesR1 = powerOfTwo / 2;
    for (let i = 0; i < numMatchesR1; i++) {
      const p1 = padded[i];
      const p2 = padded[powerOfTwo - 1 - i];
      matches.push({
        matchId: `WB-R1-M${i + 1}`,
        round: 1,
        player1: p1,
        player2: p2,
        bracket: 'winners',
        isBye: p1 === 'BYE' || p2 === 'BYE'
      });
    }

    // Grand Finals placeholder
    matches.push({
      matchId: 'GF-M1',
      round: 99,
      player1: 'TBD',
      player2: 'TBD',
      bracket: 'finals',
      isBye: false
    });

    return matches;
  }
}
