import { TcpPoolStats, RecycleDecision } from '../../types/sre';

export class TcpConnectionPoolRecycler {
  private maxIdleTimeMs: number;

  constructor(maxIdleTimeMs: number = 30000) {
    this.maxIdleTimeMs = maxIdleTimeMs;
  }

  evaluatePool(stats: TcpPoolStats): RecycleDecision {
    if (stats.idleSockets > 20 && stats.maxAgeMs > this.maxIdleTimeMs) {
      const socketsToClose = Math.floor(stats.idleSockets * 0.5);
      return {
        socketsToClose,
        reclaimedPorts: socketsToClose
      };
    }
    return {
      socketsToClose: 0,
      reclaimedPorts: 0
    };
  }
}
