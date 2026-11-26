import test from 'node:test';
import assert from 'node:assert/strict';

class BattleChatToxicityAnalyzer {
  constructor() {
    this.toxicWords = new Set(['trash', 'cheat', 'noob', 'idiot']);
  }

  analyzeMessage(message) {
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

test('BattleChatToxicityAnalyzer - flags unsportsmanlike messages in battle chat', () => {
  const analyzer = new BattleChatToxicityAnalyzer();

  const friendly = analyzer.analyzeMessage('gg wp well played');
  assert.strictEqual(friendly.isToxic, false);
  assert.strictEqual(friendly.sentiment, 'positive');

  const toxic = analyzer.analyzeMessage('you are such a trash noob');
  assert.strictEqual(toxic.isToxic, true);
  assert.strictEqual(toxic.sentiment, 'hostile');
  assert.strictEqual(toxic.flaggedKeywords.length, 2);
});
