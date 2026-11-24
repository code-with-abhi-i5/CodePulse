import { SwissPairingService, Participant, SwissMatch } from './swiss-pairing.service';
import { TournamentBracketService } from './tournament-bracket.service';

describe('SwissPairingService & TournamentBracketService', () => {
  let swissService: SwissPairingService;
  let bracketService: TournamentBracketService;

  beforeEach(() => {
    swissService = new SwissPairingService();
    bracketService = new TournamentBracketService();
  });

  describe('SwissPairingService', () => {
    it('should generate round 1 pairings accurately for an even number of participants', () => {
      const participants: Participant[] = [
        { id: 'p1', name: 'Player 1', rating: 2100, score: 0, opponentsPlayed: [], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true },
        { id: 'p2', name: 'Player 2', rating: 2000, score: 0, opponentsPlayed: [], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true },
        { id: 'p3', name: 'Player 3', rating: 1900, score: 0, opponentsPlayed: [], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true },
        { id: 'p4', name: 'Player 4', rating: 1800, score: 0, opponentsPlayed: [], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true },
      ];

      const pairings = swissService.generateRoundPairings(1, participants, []);
      expect(pairings.length).toBe(2);
      expect(pairings[0].player1Id).toBe('p1');
      expect(pairings[0].player2Id).toBe('p2');
      expect(pairings[1].player1Id).toBe('p3');
      expect(pairings[1].player2Id).toBe('p4');
    });

    it('should assign a bye to the lowest ranked player when participant count is odd', () => {
      const participants: Participant[] = [
        { id: 'p1', name: 'Player 1', rating: 2100, score: 0, opponentsPlayed: [], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true },
        { id: 'p2', name: 'Player 2', rating: 2000, score: 0, opponentsPlayed: [], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true },
        { id: 'p3', name: 'Player 3', rating: 1500, score: 0, opponentsPlayed: [], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true },
      ];

      const pairings = swissService.generateRoundPairings(1, participants, []);
      const byeMatch = pairings.find((m) => m.isBye);

      expect(byeMatch).toBeDefined();
      expect(byeMatch?.player1Id).toBe('p3');
      expect(byeMatch?.winnerId).toBe('p3');
      expect(participants.find((p) => p.id === 'p3')?.hadBye).toBe(true);
      expect(participants.find((p) => p.id === 'p3')?.score).toBe(1.0);
    });

    it('should calculate Buchholz and Sonneborn-Berger tiebreakers correctly', () => {
      const p1: Participant = { id: 'p1', name: 'P1', rating: 2000, score: 2, opponentsPlayed: ['p2', 'p3'], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true };
      const p2: Participant = { id: 'p2', name: 'P2', rating: 1800, score: 1, opponentsPlayed: ['p1'], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true };
      const p3: Participant = { id: 'p3', name: 'P3', rating: 1700, score: 0.5, opponentsPlayed: ['p1'], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true };

      const participants = new Map<string, Participant>([
        ['p1', p1],
        ['p2', p2],
        ['p3', p3],
      ]);

      const history: SwissMatch[] = [
        { matchId: 'm1', round: 1, player1Id: 'p1', player2Id: 'p2', winnerId: 'p1' },
        { matchId: 'm2', round: 2, player1Id: 'p1', player2Id: 'p3', winnerId: 'p1' },
      ];

      swissService.calculateTiebreakers(participants, history);

      expect(p1.tiebreakers.buchholz).toBe(1.5); // 1 + 0.5
      expect(p1.tiebreakers.sonnebornBerger).toBe(1.5);
    });

    it('should cleanly handle player forfeits and deactivate forfeiting participant', () => {
      const p1: Participant = { id: 'p1', name: 'P1', rating: 2000, score: 0, opponentsPlayed: ['p2'], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true };
      const p2: Participant = { id: 'p2', name: 'P2', rating: 1800, score: 0, opponentsPlayed: ['p1'], hadBye: false, tiebreakers: { buchholz: 0, medianBuchholz: 0, sonnebornBerger: 0 }, isActive: true };

      const participants = new Map<string, Participant>([
        ['p1', p1],
        ['p2', p2],
      ]);

      const match: SwissMatch = {
        matchId: 'm1',
        round: 1,
        player1Id: 'p1',
        player2Id: 'p2',
      };

      const resolved = swissService.handleForfeit(match, 'p2', participants);
      expect(resolved.winnerId).toBe('p1');
      expect(resolved.isForfeit).toBe(true);
      expect(p1.score).toBe(1.0);
      expect(p2.isActive).toBe(false);
    });
  });

  describe('TournamentBracketService', () => {
    it('should generate a valid double-elimination bracket for 8 participants', () => {
      const seeds = ['seed1', 'seed2', 'seed3', 'seed4', 'seed5', 'seed6', 'seed7', 'seed8'];
      const bracket = bracketService.generateDoubleEliminationBracket('tourney-1', seeds);

      expect(bracket.tournamentId).toBe('tourney-1');
      expect(bracket.winnersBracketRounds).toBe(3);
      expect(bracket.losersBracketRounds).toBe(4);
      expect(bracket.matches.has('WB-R1-M1')).toBe(true);
      expect(bracket.matches.has('GF-M1')).toBe(true);
      expect(bracket.matches.has('GF-M2-RESET')).toBe(true);
    });

    it('should progress winners through the bracket when results are reported', () => {
      const seeds = ['seed1', 'seed2', 'seed3', 'seed4'];
      const bracket = bracketService.generateDoubleEliminationBracket('tourney-mini', seeds);

      bracketService.reportMatchResult(bracket, 'WB-R1-M1', 'seed1');
      expect(bracket.matches.get('WB-R1-M1')?.winnerId).toBe('seed1');
      expect(bracket.matches.get('WB-R1-M1')?.loserId).toBe('seed4');
      expect(bracket.matches.get('WB-R1-M1')?.isCompleted).toBe(true);
    });

    it('should crown champion when winners bracket winner wins Grand Finals', () => {
      const seeds = ['s1', 's2'];
      const bracket = bracketService.generateDoubleEliminationBracket('tourney-finals', seeds);

      // Populate Grand Finals
      const gf = bracket.matches.get('GF-M1')!;
      gf.player1Id = 's1';
      gf.player2Id = 's2';

      bracketService.reportMatchResult(bracket, 'GF-M1', 's1');
      expect(bracket.isCompleted).toBe(true);
      expect(bracket.championId).toBe('s1');
    });

    it('should trigger Grand Finals Reset match when losers bracket champion wins GF-M1', () => {
      const seeds = ['s1', 's2'];
      const bracket = bracketService.generateDoubleEliminationBracket('tourney-reset', seeds);

      const gf = bracket.matches.get('GF-M1')!;
      gf.player1Id = 's1'; // Winners bracket winner
      gf.player2Id = 's2'; // Losers bracket winner

      bracketService.reportMatchResult(bracket, 'GF-M1', 's2');
      expect(bracket.isCompleted).toBe(false);

      const resetMatch = bracket.matches.get('GF-M2-RESET')!;
      expect(resetMatch.player1Id).toBe('s1');
      expect(resetMatch.player2Id).toBe('s2');

      // Now play reset match
      bracketService.reportMatchResult(bracket, 'GF-M2-RESET', 's2');
      expect(bracket.isCompleted).toBe(true);
      expect(bracket.championId).toBe('s2');
    });
  });
});
