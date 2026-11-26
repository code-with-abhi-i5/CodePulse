import assert from 'node:assert/strict';
import test from 'node:test';

class RoomMeshService {
  constructor() {
    this.regionRouting = new Map();
    this.meshEvents = [];
    this.regionRouting.set('room-1', ['aws-us-east', 'aws-eu-west', 'gcp-asia-south']);
  }

  routeCrossRegion(event) {
    const targets = this.regionRouting.get(event.roomId) || ['aws-us-east'];
    const delivered = targets.filter(r => r !== event.originRegion);
    this.meshEvents.push(event);
    return { deliveredRegions: delivered, latencyMs: 14.2 };
  }

  registerRoom(roomId, regions) {
    this.regionRouting.set(roomId, regions);
  }

  getEventCount() {
    return this.meshEvents.length;
  }
}

test('RoomMeshService: routes battle room events across AWS and GCP multi-region nodes', () => {
  const mesh = new RoomMeshService();
  const event = {
    eventId: 'evt-1',
    roomId: 'room-1',
    originRegion: 'aws-us-east',
    eventType: 'CODE_SUBMITTED',
    payload: { score: 100 },
    timestamp: Date.now()
  };

  const res = mesh.routeCrossRegion(event);
  assert.equal(res.deliveredRegions.length, 2);
  assert.ok(res.deliveredRegions.includes('aws-eu-west'));
  assert.ok(res.deliveredRegions.includes('gcp-asia-south'));
  assert.equal(mesh.getEventCount(), 1);
});
