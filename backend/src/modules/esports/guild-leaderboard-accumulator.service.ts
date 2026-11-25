import { Injectable } from '@nestjs/common';
import { GuildMemberScore, GuildScoreResult } from '../../types/esports';

@Injectable()
export class GuildLeaderboardAccumulatorService {
  aggregateGuildScores(guildId: string, memberScores: GuildMemberScore[]): GuildScoreResult {
    const topScores = memberScores
      .map(m => m.score)
      .sort((a, b) => b - a)
      .slice(0, 5);

    const totalScore = topScores.reduce((acc, s) => acc + s, 0);

    return {
      guildId,
      totalScore,
      countedScores: topScores
    };
  }
}
