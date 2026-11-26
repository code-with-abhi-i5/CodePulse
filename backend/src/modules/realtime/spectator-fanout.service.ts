import { Injectable, Logger } from '@nestjs/common';
import { SpectatorNode } from '../../../src/types/realtime';

@Injectable()
export class SpectatorFanoutService {
  private readonly logger = new Logger(SpectatorFanoutService.name);
  private roomTrees: Map<string, SpectatorNode[]> = new Map();

  public registerNode(node: SpectatorNode): void {
    if (!this.roomTrees.has(node.roomId)) {
      this.roomTrees.set(node.roomId, []);
    }
    this.roomTrees.get(node.roomId)!.push(node);
  }

  public broadcastToSpectators(roomId: string, update: Record<string, unknown>): { totalViewersReached: number; nodesCount: number } {
    const nodes = this.roomTrees.get(roomId) || [];
    const viewers = nodes.reduce((sum, n) => sum + n.viewerCount, 0);
    return {
      totalViewersReached: viewers,
      nodesCount: nodes.length
    };
  }

  public getViewerCount(roomId: string): number {
    const nodes = this.roomTrees.get(roomId) || [];
    return nodes.reduce((sum, n) => sum + n.viewerCount, 0);
  }
}
