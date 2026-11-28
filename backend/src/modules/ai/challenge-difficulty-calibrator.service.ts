import { DifficultyCalibration } from '../../types/ai';

export class ChallengeDifficultyCalibratorService {
  calibrateDifficulty(description: string, starterCode: string, tags: string[]): DifficultyCalibration {
    let difficultyScore = 3;
    const factors: string[] = [];

    if (tags.includes('dp') || tags.includes('dynamic-programming')) {
      difficultyScore += 3;
      factors.push('Dynamic programming recurrence complexity');
    }
    if (tags.includes('graph') || tags.includes('tree')) {
      difficultyScore += 2;
      factors.push('Non-linear data structure traversal requirement');
    }
    if (tags.includes('bit-manipulation')) {
      difficultyScore += 2;
      factors.push('Low-level bitwise operations');
    }

    if (starterCode.includes('interface TreeNode') || starterCode.includes('class Node')) {
      difficultyScore += 1;
      factors.push('Custom object references');
    }

    difficultyScore = Math.min(Math.max(difficultyScore, 1), 10);

    let tier: 'easy' | 'medium' | 'hard' | 'expert' = 'easy';
    let predictedPassRate = 80;

    if (difficultyScore >= 8) {
      tier = 'expert';
      predictedPassRate = 22;
    } else if (difficultyScore >= 6) {
      tier = 'hard';
      predictedPassRate = 42;
    } else if (difficultyScore >= 4) {
      tier = 'medium';
      predictedPassRate = 65;
    }

    return {
      predictedDifficulty: difficultyScore,
      difficultyTier: tier,
      predictedPassRate,
      complexityFactors: factors
    };
  }
}
