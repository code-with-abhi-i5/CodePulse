import { MultiplexedMessage } from '../../types/sre';

export class SocketClusterMultiplexer {
  private channelSubscribers: Map<string, Set<string>> = new Map();

  subscribe(socketId: string, channel: string): void {
    if (!this.channelSubscribers.has(channel)) {
      this.channelSubscribers.set(channel, new Set());
    }
    this.channelSubscribers.get(channel)!.add(socketId);
  }

  unsubscribe(socketId: string, channel: string): void {
    const subs = this.channelSubscribers.get(channel);
    if (subs) {
      subs.delete(socketId);
      if (subs.size === 0) this.channelSubscribers.delete(channel);
    }
  }

  broadcast(channel: string, event: string, payload: Record<string, unknown>): { recipientCount: number; message: MultiplexedMessage } {
    const subs = this.channelSubscribers.get(channel) || new Set();
    const message: MultiplexedMessage = {
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

  getChannelAudience(channel: string): number {
    return this.channelSubscribers.get(channel)?.size || 0;
  }
}
