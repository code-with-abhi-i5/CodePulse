import { LeasedConnectionRecord } from '../../types/db';

export class ConnectionLeakSentryService {
  private leasedConnections: Map<string, { acquiredAt: number; context: string }> = new Map();
  private readonly maxLeaseDurationMs = 10000;

  leaseConnection(connectionId: string, context: string): void {
    this.leasedConnections.set(connectionId, { acquiredAt: Date.now(), context });
  }

  releaseConnection(connectionId: string): void {
    this.leasedConnections.delete(connectionId);
  }

  scanForLeaks(): LeasedConnectionRecord[] {
    const now = Date.now();
    const leaked: LeasedConnectionRecord[] = [];

    for (const [id, record] of this.leasedConnections.entries()) {
      const held = now - record.acquiredAt;
      if (held > this.maxLeaseDurationMs) {
        leaked.push({
          connectionId: id,
          acquiredAt: record.acquiredAt,
          heldDurationMs: held,
          isLeaked: true,
          handlerContext: record.context
        });
      }
    }

    return leaked;
  }
}
