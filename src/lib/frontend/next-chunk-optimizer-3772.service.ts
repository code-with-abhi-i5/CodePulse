export interface Chunk { name: string; sizeKb: number; splitRequired: boolean; }
export class NextRouteChunkOptimizerService_3772 {
  private maxThresholdKb: number = 200;
  public evaluateChunk(name: string, sizeKb: number): Chunk {
    return { name, sizeKb, splitRequired: sizeKb > this.maxThresholdKb };
  }
  public planSplit(chunk: Chunk): string[] {
    if (!chunk.splitRequired) return [chunk.name];
    return [chunk.name + '-vendor', chunk.name + '-icons'];
  }
}