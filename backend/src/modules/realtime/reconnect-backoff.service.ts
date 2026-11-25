import { Injectable, Logger } from '@nestjs/common';
import { ReconnectState } from '../../../src/types/realtime';

@Injectable()
export class ReconnectBackoffService {
  private readonly logger = new Logger(ReconnectBackoffService.name);
  private clientStates: Map<string, { attempts: number; queue: string[] }> = new Map();

  public getNextBackoffMs(clientId: string): number {
    let state = this.clientStates.get(clientId);
    if (!state) {
      state = { attempts: 0, queue: [] };
      this.clientStates.set(clientId, state);
    }
    state.attempts++;
    const base = Math.min(1000 * Math.pow(2, state.attempts - 1), 30000);
    const jitter = Math.floor(Math.random() * 200);
    return base + jitter;
  }

  public enqueueMessage(clientId: string, msg: string): number {
    let state = this.clientStates.get(clientId);
    if (!state) {
      state = { attempts: 0, queue: [] };
      this.clientStates.set(clientId, state);
    }
    state.queue.push(msg);
    return state.queue.length;
  }

  public flushMessageQueue(clientId: string): string[] {
    const state = this.clientStates.get(clientId);
    if (!state) return [];
    const flushed = [...state.queue];
    state.queue = [];
    state.attempts = 0; // Reset after successful reconnect
    return flushed;
  }
}
