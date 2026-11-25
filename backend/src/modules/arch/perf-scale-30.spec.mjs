import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TournamentBracketStreamingChunkerService } from './perf-scale-30.service.ts';

describe('TournamentBracketStreamingChunkerService (PERF-SCALE-30)', () => {
  it('chunks large tournament bracket matches and reassembles accurately', () => {
    const chunker = new TournamentBracketStreamingChunkerService();
    const matches = [
      { matchId: 'm1', round: 1, player1: 'A', player2: 'B' },
      { matchId: 'm2', round: 1, player1: 'C', player2: 'D' },
      { matchId: 'm3', round: 2, player1: 'A', player2: 'C' }
    ];

    const chunks = chunker.chunkMatches(matches, 2);
    assert.strictEqual(chunks.length, 2);

    const reassembled = chunker.reassemble(chunks);
    assert.deepStrictEqual(reassembled, matches);
  });
});
