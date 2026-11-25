import { Injectable, Logger } from '@nestjs/common';
import { ChatMessage } from '../../../src/types/realtime';

@Injectable()
export class ChatSentimentService {
  private readonly logger = new Logger(ChatSentimentService.name);
  private bannedKeywords = ['cheat', 'hack', 'toxic', 'idiot', 'abuse'];
  private userMessageTimestamps: Map<string, number[]> = new Map();

  public filterMessage(roomId: string, userId: string, text: string): { allowed: boolean; reason?: string; message?: ChatMessage } {
    const now = Date.now();
    // Rate limit check: max 5 messages per 3 seconds
    let timestamps = this.userMessageTimestamps.get(userId) || [];
    timestamps = timestamps.filter(t => now - t < 3000);
    if (timestamps.length >= 5) {
      return { allowed: false, reason: 'RATE_LIMIT_EXCEEDED' };
    }
    timestamps.push(now);
    this.userMessageTimestamps.set(userId, timestamps);

    // Toxicity keyword detection
    const lower = text.toLowerCase();
    const hasToxicity = this.bannedKeywords.some(w => lower.includes(w));
    if (hasToxicity) {
      return { allowed: false, reason: 'TOXICITY_DETECTED' };
    }

    const message: ChatMessage = {
      id: `msg-${now}-${Math.floor(Math.random() * 1000)}`,
      roomId,
      userId,
      text,
      flagged: false,
      timestamp: now
    };
    return { allowed: true, message };
  }
}
