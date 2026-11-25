import assert from 'node:assert/strict';
import test from 'node:test';

class ChatSentimentService {
  constructor() {
    this.bannedKeywords = ['cheat', 'hack', 'toxic', 'idiot'];
    this.userMessageTimestamps = new Map();
  }

  filterMessage(roomId, userId, text) {
    const now = Date.now();
    let timestamps = this.userMessageTimestamps.get(userId) || [];
    timestamps = timestamps.filter(t => now - t < 3000);
    if (timestamps.length >= 5) return { allowed: false, reason: 'RATE_LIMIT_EXCEEDED' };
    timestamps.push(now);
    this.userMessageTimestamps.set(userId, timestamps);

    const hasToxicity = this.bannedKeywords.some(w => text.toLowerCase().includes(w));
    if (hasToxicity) return { allowed: false, reason: 'TOXICITY_DETECTED' };

    return { allowed: true, message: { id: `msg-${now}`, roomId, userId, text } };
  }
}

test('ChatSentimentService: filters toxicity and rate-limits rapid chat bursts', () => {
  const chat = new ChatSentimentService();
  const clean = chat.filterMessage('r1', 'u1', 'Good game!');
  assert.equal(clean.allowed, true);

  const toxic = chat.filterMessage('r1', 'u1', 'You are using a hack');
  assert.equal(toxic.allowed, false);
  assert.equal(toxic.reason, 'TOXICITY_DETECTED');

  // Spam 5 messages
  for (let i = 0; i < 5; i++) {
    chat.filterMessage('r1', 'u2', 'Hello');
  }
  const spam = chat.filterMessage('r1', 'u2', 'Hello again');
  assert.equal(spam.allowed, false);
  assert.equal(spam.reason, 'RATE_LIMIT_EXCEEDED');
});
