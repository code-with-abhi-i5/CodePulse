import { ToxicityAnalysis } from '../../types/ai';

export class BattleChatToxicityAnalyzer {
  private toxicWords: Set<string> = new Set(['trash', 'cheat', 'noob', 'idiot', 'hacker']);

  analyzeMessage(message: string): ToxicityAnalysis {
    const words = message.toLowerCase().split(/\s+/);
    const flagged = words.filter(w => this.toxicWords.has(w));

    const isToxic = flagged.length > 0;
    const toxicityScore = Math.min(1.0, flagged.length * 0.35);

    return {
      isToxic,
      toxicityScore,
      sentiment: isToxic ? 'hostile' : (message.includes('gg') ? 'positive' : 'neutral'),
      flaggedKeywords: flagged
    };
  }
}
