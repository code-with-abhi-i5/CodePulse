import { BackpressureBufferState } from '../../types/ai';

export class StreamingBackpressureBufferService {
  private buffer: string[] = [];
  private currentBytes = 0;
  private readonly highWaterMark: number;
  private readonly lowWaterMark: number;

  constructor(highWaterMark: number = 64 * 1024, lowWaterMark: number = 16 * 1024) {
    this.highWaterMark = highWaterMark;
    this.lowWaterMark = lowWaterMark;
  }

  pushChunk(chunk: string): boolean {
    const bytes = Buffer.byteLength(chunk, 'utf8');
    this.buffer.push(chunk);
    this.currentBytes += bytes;
    return this.currentBytes < this.highWaterMark;
  }

  drainChunk(): string | null {
    if (this.buffer.length === 0) return null;
    const chunk = this.buffer.shift()!;
    this.currentBytes -= Buffer.byteLength(chunk, 'utf8');
    return chunk;
  }

  getState(): BackpressureBufferState {
    return {
      bufferSizeBytes: this.currentBytes,
      highWaterMarkBytes: this.highWaterMark,
      isPaused: this.currentBytes >= this.highWaterMark,
      droppedTokens: 0
    };
  }
}
