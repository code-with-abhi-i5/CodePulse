export class CircularTerminalRingBuffer {
  private buffer: Buffer;
  private capacity: number;
  private head = 0;
  private tail = 0;
  private isFull = false;

  constructor(capacity = 1024 * 64) {
    this.capacity = capacity;
    this.buffer = Buffer.alloc(capacity);
  }

  public write(data: Buffer | string): void {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
    for (let i = 0; i < input.length; i++) {
      this.buffer[this.head] = input[i];
      this.head = (this.head + 1) % this.capacity;
      if (this.isFull) {
        this.tail = (this.tail + 1) % this.capacity;
      } else if (this.head === this.tail) {
        this.isFull = true;
      }
    }
  }

  public readTail(bytesCount: number): Buffer {
    const available = this.size();
    const count = Math.min(bytesCount, available);
    const result = Buffer.alloc(count);

    let readPos = (this.head - count + this.capacity) % this.capacity;
    for (let i = 0; i < count; i++) {
      result[i] = this.buffer[readPos];
      readPos = (readPos + 1) % this.capacity;
    }

    return result;
  }

  public size(): number {
    if (this.isFull) return this.capacity;
    if (this.head >= this.tail) return this.head - this.tail;
    return this.capacity - this.tail + this.head;
  }

  public clear(): void {
    this.head = 0;
    this.tail = 0;
    this.isFull = false;
  }
}
