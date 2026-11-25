import { Injectable } from '@nestjs/common';
import { MatchmakingPlayer, MatchmakingPair } from '../../types/esports';

@Injectable()
export class MatchmakingBracketQueueService {
  private queue: MatchmakingPlayer[] = [];

  enqueue(player: MatchmakingPlayer): void {
    this.queue.push(player);
  }

  findMatch(playerId: string, currentTime: number): MatchmakingPair | null {
    const pIdx = this.queue.findIndex(p => p.id === playerId);
    if (pIdx === -1) return null;

    const player = this.queue[pIdx];
    const waitedSec = Math.floor((currentTime - player.enqueuedAt) / 1000);
    const maxDelta = 50 + waitedSec * 10;

    for (let i = 0; i < this.queue.length; i++) {
      if (i === pIdx) continue;
      const candidate = this.queue[i];
      const delta = Math.abs(player.rating - candidate.rating);
      if (delta <= maxDelta) {
        this.queue.splice(Math.max(i, pIdx), 1);
        this.queue.splice(Math.min(i, pIdx), 1);
        return {
          player1: player,
          player2: candidate,
          ratingDelta: delta,
          waitedMs: currentTime - player.enqueuedAt
        };
      }
    }

    return null;
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}
