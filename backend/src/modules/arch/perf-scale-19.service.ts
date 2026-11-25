/**
 * Architecture Service: IPC Shared Memory Transport
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-19]
 */

export class IpcSharedMemoryTransportService {
  private buffer: string[];
  private capacity: number;
  private writePointer: number;
  private readPointer: number;

  constructor(capacity: number = 64) {
    this.buffer = new Array(capacity);
    this.capacity = capacity;
    this.writePointer = 0;
    this.readPointer = 0;
  }

  public write(message: string): boolean {
    const nextWrite = (this.writePointer + 1) % this.capacity;
    if (nextWrite === this.readPointer) {
      return false; // Ring buffer full
    }
    this.buffer[this.writePointer] = message;
    this.writePointer = nextWrite;
    return true;
  }

  public read(): string | null {
    if (this.readPointer === this.writePointer) {
      return null; // Empty
    }
    const msg = this.buffer[this.readPointer];
    this.readPointer = (this.readPointer + 1) % this.capacity;
    return msg;
  }

  public getAvailableCount(): number {
    if (this.writePointer >= this.readPointer) {
      return this.writePointer - this.readPointer;
    }
    return this.capacity - (this.readPointer - this.writePointer);
  }
}
