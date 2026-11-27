export class LockFreeMPMCRingBuffer<T = any> {
  private buffer: (T | undefined)[];
  private capacity: number;
  private head = 0;
  private tail = 0;
  private count = 0;

  constructor(capacity = 256) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  public enqueue(item: T): boolean {
    if (this.count >= this.capacity) {
      return false; // Queue full
    }
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return true;
  }

  public dequeue(): T | null {
    if (this.count === 0) {
      return null; // Queue empty
    }
    const item = this.buffer[this.head]!;
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }

  public size(): number {
    return this.count;
  }
}
