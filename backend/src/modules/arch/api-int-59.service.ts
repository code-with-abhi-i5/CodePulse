/**
 * Architecture Service: GraphQL Field Deprecation Telemetry Logger
 * Subsystem: API Evolution & Sunset Tracking
 */

export class GraphqlFieldDeprecationTelemetryService {
  private readonly usageCounts = new Map<string, Map<string, number>>(); // field -> (client -> count)

  public recordUsage(fieldName: string, clientId: string): void {
    if (!this.usageCounts.has(fieldName)) {
      this.usageCounts.set(fieldName, new Map());
    }
    const clientMap = this.usageCounts.get(fieldName)!;
    clientMap.set(clientId, (clientMap.get(clientId) || 0) + 1);
  }

  public getUsageCount(fieldName: string): number {
    const clientMap = this.usageCounts.get(fieldName);
    if (!clientMap) return 0;
    let total = 0;
    for (const count of clientMap.values()) total += count;
    return total;
  }
}
