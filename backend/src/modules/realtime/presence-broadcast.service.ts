import { Injectable, Logger } from '@nestjs/common';
import { PresenceCursor } from '../../../src/types/realtime';

@Injectable()
export class PresenceBroadcastService {
  private readonly logger = new Logger(PresenceBroadcastService.name);
  private roomCursors: Map<string, Map<string, PresenceCursor>> = new Map();
  private lastBroadcastTime: Map<string, number> = new Map();

  public updateCursor(cursor: PresenceCursor): boolean {
    const now = Date.now();
    const lastTime = this.lastBroadcastTime.get(cursor.userId) || 0;
    // 30Hz throttle = 33ms interval
    if (now - lastTime < 33) {
      return false; // Throttled
    }

    if (!this.roomCursors.has(cursor.roomId)) {
      this.roomCursors.set(cursor.roomId, new Map());
    }

    this.roomCursors.get(cursor.roomId)!.set(cursor.userId, { ...cursor, updatedAt: now });
    this.lastBroadcastTime.set(cursor.userId, now);
    return true;
  }

  public getRoomPresence(roomId: string): PresenceCursor[] {
    const room = this.roomCursors.get(roomId);
    if (!room) return [];
    return Array.from(room.values());
  }

  public removeUser(roomId: string, userId: string): boolean {
    const room = this.roomCursors.get(roomId);
    if (!room) return false;
    return room.delete(userId);
  }
}
