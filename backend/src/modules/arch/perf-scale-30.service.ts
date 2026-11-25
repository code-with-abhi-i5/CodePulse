/**
 * Architecture Service: Tournament Bracket Streaming Chunker
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-30]
 */

export interface BracketMatch {
  matchId: string;
  round: number;
  player1: string;
  player2: string;
  winner?: string;
}

export class TournamentBracketStreamingChunkerService {
  public chunkMatches(matches: BracketMatch[], chunkSize: number = 2): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < matches.length; i += chunkSize) {
      const slice = matches.slice(i, i + chunkSize);
      chunks.push(JSON.stringify({ chunkIndex: Math.floor(i / chunkSize), matches: slice }));
    }
    return chunks;
  }

  public reassemble(chunks: string[]): BracketMatch[] {
    const allMatches: BracketMatch[] = [];
    for (const c of chunks) {
      const parsed = JSON.parse(c);
      allMatches.push(...parsed.matches);
    }
    return allMatches;
  }
}
