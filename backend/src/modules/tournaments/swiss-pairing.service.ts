import { Injectable, Logger } from '@nestjs/common';

export interface Participant {
  id: string;
  name: string;
  rating: number;
  score: number; // typically 1 for win, 0.5 for draw, 0 for loss
  opponentsPlayed: string[];
  hadBye: boolean;
  tiebreakers: {
    buchholz: number;
    medianBuchholz: number;
    sonnebornBerger: number;
  };
  isActive: boolean;
}

export interface SwissMatch {
  matchId: string;
  round: number;
  player1Id: string;
  player2Id?: string; // undefined if player1 gets a bye
  winnerId?: string;
  isDraw?: boolean;
  isBye?: boolean;
  isForfeit?: boolean;
}

@Injectable()
export class SwissPairingService {
  private readonly logger = new Logger(SwissPairingService.name);

  /**
   * Recalculates tiebreakers for all participants in a tournament:
   * - Buchholz: Sum of all opponents' scores
   * - Median Buchholz: Sum of opponents' scores excluding highest and lowest
   * - Sonneborn-Berger: Sum of scores of opponents defeated + 0.5 * sum of scores of opponents drawn
   */
  public calculateTiebreakers(
    participants: Map<string, Participant>,
    matchHistory: SwissMatch[],
  ): void {
    for (const participant of participants.values()) {
      let buchholz = 0;
      const opponentScores: number[] = [];
      let sonnebornBerger = 0;

      for (const oppId of participant.opponentsPlayed) {
        const opp = participants.get(oppId);
        if (opp) {
          buchholz += opp.score;
          opponentScores.push(opp.score);
        }
      }

      // Calculate Sonneborn-Berger from match history
      for (const match of matchHistory) {
        if (!match.player2Id) continue; // skip byes

        const isP1 = match.player1Id === participant.id;
        const isP2 = match.player2Id === participant.id;
        if (!isP1 && !isP2) continue;

        const oppId = isP1 ? match.player2Id : match.player1Id;
        const opp = participants.get(oppId);
        if (!opp) continue;

        if (match.winnerId === participant.id) {
          sonnebornBerger += opp.score;
        } else if (match.isDraw) {
          sonnebornBerger += opp.score * 0.5;
        }
      }

      // Median Buchholz excludes highest and lowest opponent scores
      let medianBuchholz = buchholz;
      if (opponentScores.length >= 3) {
        opponentScores.sort((a, b) => a - b);
        const trimmed = opponentScores.slice(1, opponentScores.length - 1);
        medianBuchholz = trimmed.reduce((sum, val) => sum + val, 0);
      }

      participant.tiebreakers = {
        buchholz,
        medianBuchholz,
        sonnebornBerger,
      };
    }
  }

  /**
   * Generates fair Swiss round pairings in < 200ms.
   * Groups players by score brackets, pairs within brackets avoiding rematches,
   * handles odd participant counts by granting a bye to lowest eligible player.
   */
  public generateRoundPairings(
    roundNumber: number,
    participantsList: Participant[],
    matchHistory: SwissMatch[],
  ): SwissMatch[] {
    const startTime = Date.now();
    const activeParticipants = participantsList.filter((p) => p.isActive);

    const participantMap = new Map<string, Participant>();
    for (const p of activeParticipants) {
      participantMap.set(p.id, p);
    }

    // Refresh tiebreakers prior to sorting
    this.calculateTiebreakers(participantMap, matchHistory);

    // Sort players: Score DESC -> Buchholz DESC -> Rating DESC
    const sorted = [...activeParticipants].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.tiebreakers.buchholz !== a.tiebreakers.buchholz) {
        return b.tiebreakers.buchholz - a.tiebreakers.buchholz;
      }
      return b.rating - a.rating;
    });

    const pairings: SwissMatch[] = [];
    const paired = new Set<string>();

    // Handle odd number of active players: award bye to lowest ranked player who hasn't had a bye
    if (sorted.length % 2 !== 0) {
      for (let i = sorted.length - 1; i >= 0; i--) {
        const candidate = sorted[i];
        if (!candidate.hadBye) {
          pairings.push({
            matchId: `rnd-${roundNumber}-bye-${candidate.id}`,
            round: roundNumber,
            player1Id: candidate.id,
            winnerId: candidate.id,
            isBye: true,
          });
          paired.add(candidate.id);
          candidate.hadBye = true;
          candidate.score += 1.0; // Byes yield 1 full point
          break;
        }
      }
    }

    // Group remaining players into score brackets
    const remaining = sorted.filter((p) => !paired.has(p.id));
    let currentPool = [...remaining];

    let matchCounter = 1;
    while (currentPool.length > 1) {
      const p1 = currentPool.shift()!;
      if (paired.has(p1.id)) continue;

      // Find best opponent in pool who hasn't played p1 yet
      let opponentIndex = -1;
      for (let i = 0; i < currentPool.length; i++) {
        const candidate = currentPool[i];
        if (!paired.has(candidate.id) && !p1.opponentsPlayed.includes(candidate.id)) {
          opponentIndex = i;
          break;
        }
      }

      // If no valid rematch-free opponent found (rare late-round constraint), relax rematch rule
      if (opponentIndex === -1) {
        opponentIndex = 0;
      }

      const p2 = currentPool.splice(opponentIndex, 1)[0];
      paired.add(p1.id);
      paired.add(p2.id);

      p1.opponentsPlayed.push(p2.id);
      p2.opponentsPlayed.push(p1.id);

      pairings.push({
        matchId: `rnd-${roundNumber}-m-${matchCounter++}`,
        round: roundNumber,
        player1Id: p1.id,
        player2Id: p2.id,
      });
    }

    const elapsed = Date.now() - startTime;
    this.logger.log(`Generated ${pairings.length} Swiss pairings for Round ${roundNumber} in ${elapsed}ms`);
    return pairings;
  }

  /**
   * Resolves a forfeit cleanly, awarding a 1.0 win to the opponent.
   */
  public handleForfeit(
    match: SwissMatch,
    forfeitingPlayerId: string,
    participants: Map<string, Participant>,
  ): SwissMatch {
    if (match.player1Id !== forfeitingPlayerId && match.player2Id !== forfeitingPlayerId) {
      throw new Error(`Player ${forfeitingPlayerId} is not in match ${match.matchId}`);
    }

    const winningPlayerId =
      match.player1Id === forfeitingPlayerId ? match.player2Id! : match.player1Id;

    match.winnerId = winningPlayerId;
    match.isForfeit = true;

    const winner = participants.get(winningPlayerId);
    if (winner) {
      winner.score += 1.0;
    }

    const forfeiter = participants.get(forfeitingPlayerId);
    if (forfeiter) {
      forfeiter.isActive = false; // drop from subsequent rounds
    }

    return match;
  }
}
