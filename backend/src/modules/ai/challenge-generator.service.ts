import { Injectable, Logger } from '@nestjs/common';
import { GeneratedChallenge } from '../../../src/types/ai';

@Injectable()
export class ChallengeGeneratorService {
  private readonly logger = new Logger(ChallengeGeneratorService.name);

  public synthesizeChallenge(topic: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): GeneratedChallenge {
    return {
      title: `Optimized ${topic} Arena Challenge`,
      difficulty,
      description: `Implement an optimal algorithm solving ${topic} under p99 latency constraints.`,
      testCases: [
        { input: '[1, 2, 3]', output: '6' },
        { input: '[]', output: '0' },
        { input: '[-5, 5]', output: '0' }
      ]
    };
  }

  public validateGeneratedTests(challenge: GeneratedChallenge): boolean {
    return challenge.testCases.length >= 3 && challenge.testCases.some(tc => tc.input === '[]');
  }
}
