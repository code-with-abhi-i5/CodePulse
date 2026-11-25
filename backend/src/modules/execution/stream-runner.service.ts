import { Injectable, Logger } from '@nestjs/common';
import { StreamChunk } from '../../../src/types/backend';

export interface BufferedStream {
  executionId: string;
  chunks: StreamChunk[];
  maxChunkBytes: number;
}

@Injectable()
export class StreamRunnerService {
  private readonly logger = new Logger(StreamRunnerService.name);
  private streams: Map<string, BufferedStream> = new Map();
  private subscribers: Map<string, Array<(chunk: StreamChunk) => void>> = new Map();

  public createStreamBuffer(executionId: string, maxChunkBytes = 4096): BufferedStream {
    const buffer: BufferedStream = { executionId, chunks: [], maxChunkBytes };
    this.streams.set(executionId, buffer);
    return buffer;
  }

  public pushStdout(executionId: string, data: string): boolean {
    return this.pushChunk(executionId, { stream: 'stdout', data, timestamp: Date.now() });
  }

  public pushStderr(executionId: string, data: string): boolean {
    return this.pushChunk(executionId, { stream: 'stderr', data, timestamp: Date.now() });
  }

  private pushChunk(executionId: string, chunk: StreamChunk): boolean {
    let buf = this.streams.get(executionId);
    if (!buf) {
      buf = this.createStreamBuffer(executionId);
    }
    buf.chunks.push(chunk);
    const listeners = this.subscribers.get(executionId);
    if (listeners) {
      listeners.forEach(fn => fn(chunk));
    }
    return true;
  }

  public flushToWebSocket(executionId: string): StreamChunk[] {
    const buf = this.streams.get(executionId);
    if (!buf) return [];
    const flushed = [...buf.chunks];
    buf.chunks = [];
    return flushed;
  }

  public subscribeStream(executionId: string, listener: (chunk: StreamChunk) => void): () => void {
    if (!this.subscribers.has(executionId)) {
      this.subscribers.set(executionId, []);
    }
    this.subscribers.get(executionId)!.push(listener);
    return () => {
      const arr = this.subscribers.get(executionId) || [];
      this.subscribers.set(executionId, arr.filter(l => l !== listener));
    };
  }
}
