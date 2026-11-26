import { Injectable } from '@nestjs/common';
import { GlickoPlayer } from '../../types/esports';

@Injectable()
export class SeasonalRatingResetService {
  applySeasonalSoftReset(players: GlickoPlayer[], baselineRating = 1200, compression = 0.6): GlickoPlayer[] {
    return players.map(p => {
      const delta = p.rating - baselineRating;
      const compressedRating = Math.round(baselineRating + delta * compression);
      return {
        rating: Math.max(800, Math.min(3000, compressedRating)),
        rd: Math.min(350, p.rd + 50), // Increase uncertainty on new season
        vol: p.vol
      };
    });
  }
}
