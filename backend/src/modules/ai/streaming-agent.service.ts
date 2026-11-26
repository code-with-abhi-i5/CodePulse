import { Injectable, Logger } from '@nestjs/common';
import { StreamingTokenEvent } from '../../../src/types/ai';

@Injectable()
export class StreamingAgentService {
  private readonly logger = new Logger(StreamingAgentService.name);
  private activeStreams: Set<string> = new Set();

  public startStream(streamId: string): void {
    this.activeStreams.add(streamId);
  }

  public cancelStream(streamId: string): boolean {
    return this.activeStreams.delete(streamId);
  }

  public isStreamActive(streamId: string): boolean {
    return this.activeStreams.has(streamId);
  }

  public tokenizeMessage(text: string): StreamingTokenEvent[] {
    const words = text.split(' ');
    return words.map((w, idx) => ({
      token: w + ' ',
      index: idx,
      done: idx === words.length - 1
    }));
  }
}
