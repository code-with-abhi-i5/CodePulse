export class RoaringBitmapDeduplicator {
  // Simulates Roaring Bitmap chunks: top 16 bits = chunk key, bottom 16 bits = container
  private chunks = new Map<number, Set<number>>();

  public add(val: number): boolean {
    const chunkKey = (val >>> 16) & 0xffff;
    const valueInChunk = val & 0xffff;

    let container = this.chunks.get(chunkKey);
    if (!container) {
      container = new Set<number>();
      this.chunks.set(chunkKey, container);
    }

    if (container.has(valueInChunk)) {
      return false; // Already present
    }

    container.add(valueInChunk);
    return true; // Added
  }

  public contains(val: number): boolean {
    const chunkKey = (val >>> 16) & 0xffff;
    const valueInChunk = val & 0xffff;
    return this.chunks.get(chunkKey)?.has(valueInChunk) ?? false;
  }

  public cardinality(): number {
    let count = 0;
    for (const c of this.chunks.values()) {
      count += c.size;
    }
    return count;
  }
}
