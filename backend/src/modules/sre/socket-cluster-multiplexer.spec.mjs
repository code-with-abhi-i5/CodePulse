import test from 'node:test';
import assert from 'node:assert/strict';

class SocketClusterMultiplexer {
  constructor() {
    this.channelSubscribers = new Map();
  }

  subscribe(socketId, channel) {
    if (!this.channelSubscribers.has(channel)) {
      this.channelSubscribers.set(channel, new Set());
    }
    this.channelSubscribers.get(channel).add(socketId);
  }

  unsubscribe(socketId, channel) {
    const subs = this.channelSubscribers.get(channel);
    if (subs) {
      subs.delete(socketId);
      if (subs.size === 0) this.channelSubscribers.delete(channel);
    }
  }

  broadcast(channel, event, payload) {
    const subs = this.channelSubscribers.get(channel) || new Set();
    const message = {
      channel,
      event,
      payload,
      timestamp: Date.now()
    };

    return {
      recipientCount: subs.size,
      message
    };
  }

  getChannelAudience(channel) {
    return this.channelSubscribers.get(channel)?.size || 0;
  }
}

test('SocketClusterMultiplexer - manages group subscriptions and broadcasts messages', () => {
  const mux = new SocketClusterMultiplexer();
  mux.subscribe('sock_1', 'battle_456');
  mux.subscribe('sock_2', 'battle_456');
  mux.subscribe('sock_3', 'battle_789');

  assert.strictEqual(mux.getChannelAudience('battle_456'), 2);
  const res = mux.broadcast('battle_456', 'keystroke', { delta: 12 });
  assert.strictEqual(res.recipientCount, 2);
  assert.strictEqual(res.message.event, 'keystroke');

  mux.unsubscribe('sock_1', 'battle_456');
  assert.strictEqual(mux.getChannelAudience('battle_456'), 1);
});
