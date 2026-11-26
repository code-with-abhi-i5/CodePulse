import { Injectable, Logger } from '@nestjs/common';
import { RoomMeshEvent } from '../../../src/types/realtime';

@Injectable()
export class RoomMeshService {
  private readonly logger = new Logger(RoomMeshService.name);
  private regionRouting: Map<string, string[]> = new Map();
  private meshEvents: RoomMeshEvent[] = [];

  constructor() {
    this.regionRouting.set('global-battle-1', ['aws-us-east', 'aws-eu-west', 'gcp-asia-south']);
  }

  public routeCrossRegion(event: RoomMeshEvent): { deliveredRegions: string[]; latencyMs: number } {
    const targets = this.regionRouting.get(event.roomId) || ['aws-us-east'];
    const delivered = targets.filter(r => r !== event.originRegion);
    this.meshEvents.push(event);
    return {
      deliveredRegions: delivered,
      latencyMs: 14.2
    };
  }

  public registerRoom(roomId: string, regions: string[]): void {
    this.regionRouting.set(roomId, regions);
  }

  public getEventCount(): number {
    return this.meshEvents.length;
  }
}
