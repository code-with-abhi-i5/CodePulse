import { Injectable } from '@nestjs/common';

@Injectable()
export class RankingService {
  /**
   * Calculates the hidden ranking score based on the formula:
   * (stars * 0.50) + (followers * 0.25) + (repositories * 0.15) + (forks * 0.10)
   */
  calculateScore(stats: {
    totalStars: number;
    followers: number;
    publicRepos: number;
    totalForks: number;
  }): number {
    const { totalStars, followers, publicRepos, totalForks } = stats;
    
    const score = 
      (totalStars * 0.50) +
      (followers * 0.25) +
      (publicRepos * 0.15) +
      (totalForks * 0.10);

    return score;
  }
}
