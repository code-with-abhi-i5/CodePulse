import { Injectable, Logger } from '@nestjs/common';
import { BackpressureState } from '../../../src/types/realtime';

@Injectable()
export class BackpressureGuardService {
  private readonly logger = new Logger(BackpressureGuardService.name);
  private clientStates: Map<string, BackpressureState> = new Map();
  private readonly HIGH_WATERMARK_BYTES = 1024 * 1024; // 1MB
  private readonly MAX_LAG_MS = 500;

  public evaluateBackpressure(socketId: string, bufferBytes: number, lagMs: number): BackpressureState {
    const isPaused = bufferBytes >= this.HIGH_WATERMARK_BYTES || lagMs >= this.MAX_LAG_MS;
    const state: BackpressureState = {
      socketId,
      bufferedBytes: bufferBytes,
      lagMs,
      isPaused
    };
    this.clientStates.set(socketId, state);
    return state;
  }

  public shouldPausePublisher(socketId: string): boolean {
    const state = this.clientStates.get(socketId);
    return state ? state.isPaused : false;
  }

  public drainBuffer(socketId: string): void {
    const state = this.clientStates.get(socketId);
    if (state) {
      state.bufferedBytes = 0;
      state.lagMs = 0;
      state.isPaused = false;
    }
  }
}
