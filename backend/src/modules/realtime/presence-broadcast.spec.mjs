import assert from 'node:assert/strict';
import test from 'node:test';

class PresenceBroadcastService {
  constructor() {
    this.roomCursors = new Map();
    this.lastBroadcastTime = new Map();
  }

  updateCursor(cursor) {
    const now = Date.now();
    const lastTime = this.lastBroadcastTime.get(cursor.userId) || 0;
    if (now - lastTime < 30) return false;

    if (!this.roomCursors.has(cursor.roomId)) {
      this.roomCursors.set(cursor.roomId, new Map());
    }
    this.roomCursors.get(cursor.roomId).set(cursor.userId, { ...cursor, updatedAt: now });
    this.lastBroadcastTime.set(cursor.userId, now);
    return true;
  }

  getRoomPresence(roomId) {
    const room = this.roomCursors.get(roomId);
    if (!room) return [];
    return Array.from(room.values());
  }

  removeUser(roomId, userId) {
    const room = this.roomCursors.get(roomId);
    if (!room) return false;
    return room.delete(userId);
  }
}

test('PresenceBroadcastService: throttles cursor broadcast to 30Hz and tracks coordinates', () => {
  const presence = new PresenceBroadcastService();
  const c1 = { userId: 'u1', roomId: 'r1', line: 12, column: 4 };

  const res1 = presence.updateCursor(c1);
  assert.equal(res1, true);

  // Immediate update within 30ms should throttle
  const res2 = presence.updateCursor(c1);
  assert.equal(res2, false);

  const cursors = presence.getRoomPresence('r1');
  assert.equal(cursors.length, 1);
  assert.equal(cursors[0].line, 12);
});
