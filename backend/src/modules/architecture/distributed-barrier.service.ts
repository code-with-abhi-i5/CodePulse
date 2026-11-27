export class DistributedBarrierCoordinator {
  private partiesCount: number;
  private arrived = new Set<string>();

  constructor(partiesCount: number) {
    this.partiesCount = partiesCount;
  }

  public arrive(participantId: string): boolean {
    this.arrived.add(participantId);
    return this.arrived.size >= this.partiesCount;
  }

  public isReady(): boolean {
    return this.arrived.size >= this.partiesCount;
  }

  public getArrivedCount(): number {
    return this.arrived.size;
  }

  public reset(): void {
    this.arrived.clear();
  }
}
