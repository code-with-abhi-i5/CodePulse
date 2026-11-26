import { Injectable, Logger } from '@nestjs/common';
import { ReplayEvent } from '../../../src/types/realtime';

@Injectable()
export class EventReplayService {
  private readonly logger = new Logger(EventReplayService.name);
  private stores: Map<string, ReplayEvent[]> = new Map();

  public appendEvent(matchId: string, eventType: string, payload: Record<string, unknown>): ReplayEvent {
    if (!this.stores.has(matchId)) {
      this.stores.set(matchId, []);
    }
    const store = this.stores.get(matchId)!;
    const event: ReplayEvent = {
      sequenceNumber: store.length + 1,
      matchId,
      eventType,
      timestamp: Date.now(),
      payload
    };
    store.push(event);
    return event;
  }

  public getFullMatchReplay(matchId: string): ReplayEvent[] {
    return [...(this.stores.get(matchId) || [])];
  }

  public replayFromSequence(matchId: string, fromSeq: number): ReplayEvent[] {
    const store = this.stores.get(matchId) || [];
    return store.filter(e => e.sequenceNumber >= fromSeq);
  }
}
