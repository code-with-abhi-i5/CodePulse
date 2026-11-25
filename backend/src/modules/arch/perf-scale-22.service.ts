/**
 * Architecture Service: Asynchronous Logging Ring-Buffer Transport
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-22]
 */

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

export class AsyncLoggingRingBufferTransportService {
  private buffer: LogEntry[];
  private capacity: number;
  private droppedCount: number;

  constructor(capacity: number = 100) {
    this.buffer = [];
    this.capacity = capacity;
    this.droppedCount = 0;
  }

  public log(level: 'info' | 'warn' | 'error', message: string, timestamp: number = Date.now()): boolean {
    if (this.buffer.length >= this.capacity) {
      this.droppedCount++;
      return false; // Dropped to avoid blocking
    }
    this.buffer.push({ level, message, timestamp });
    return true;
  }

  public flushBatch(maxCount: number = 50): LogEntry[] {
    return this.buffer.splice(0, maxCount);
  }

  public getStats(): { pendingLogs: number; capacity: number; droppedCount: number } {
    return {
      pendingLogs: this.buffer.length,
      capacity: this.capacity,
      droppedCount: this.droppedCount
    };
  }
}
