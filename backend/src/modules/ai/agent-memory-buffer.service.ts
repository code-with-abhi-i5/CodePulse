import { UserMistakeRecord } from '../../types/ai';

export class AgentMemoryBuffer {
  private buffer: Map<string, UserMistakeRecord[]> = new Map();

  recordMistake(userId: string, category: 'syntax' | 'logic' | 'edge_case' | 'off_by_one' | 'timeout', hintGiven: string): void {
    if (!this.buffer.has(userId)) {
      this.buffer.set(userId, []);
    }
    const list = this.buffer.get(userId)!;
    const existing = list.find(r => r.category === category);
    if (existing) {
      existing.frequency++;
      existing.lastEncounteredAt = Date.now();
      existing.hintGiven = hintGiven;
    } else {
      list.push({
        userId,
        category,
        frequency: 1,
        lastEncounteredAt: Date.now(),
        hintGiven
      });
    }
  }

  getTopMistakes(userId: string): UserMistakeRecord[] {
    const list = this.buffer.get(userId) || [];
    return [...list].sort((a, b) => b.frequency - a.frequency);
  }

  clearUserMemory(userId: string): void {
    this.buffer.delete(userId);
  }
}
