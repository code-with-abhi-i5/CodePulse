import { Injectable } from '@nestjs/common';
import { GlickoPlayer } from '../../types/esports';

@Injectable()
export class Glicko2RatingEngineService {
  private readonly defaultScale = 173.7178;

  updateRating(player: GlickoPlayer, opponent: GlickoPlayer, outcome: number): GlickoPlayer {
    const q = Math.log(10) / 400;
    const g = 1 / Math.sqrt(1 + (3 * Math.pow(q, 2) * Math.pow(opponent.rd, 2)) / Math.pow(Math.PI, 2));
    const expected = 1 / (1 + Math.pow(10, (-g * (player.rating - opponent.rating)) / 400));

    const d2 = 1 / (Math.pow(q, 2) * Math.pow(g, 2) * expected * (1 - expected));
    const newRd = Math.round(Math.sqrt(1 / (1 / Math.pow(player.rd, 2) + 1 / d2)));
    const newRating = Math.round(player.rating + (q / (1 / Math.pow(player.rd, 2) + 1 / d2)) * g * (outcome - expected));

    return {
      rating: newRating,
      rd: Math.max(30, Math.min(350, newRd)),
      vol: player.vol
    };
  }
}
