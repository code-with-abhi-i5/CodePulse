/**
 * Architecture Service: Database Read-Write Query Router
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-23]
 */

export interface DatabaseNode {
  id: string;
  role: 'PRIMARY' | 'REPLICA';
  healthy: boolean;
}

export class DatabaseQueryRouterService {
  private primary: DatabaseNode;
  private replicas: DatabaseNode[];
  private nextReplicaIndex: number;

  constructor(primaryId: string, replicaIds: string[] = []) {
    this.primary = { id: primaryId, role: 'PRIMARY', healthy: true };
    this.replicas = replicaIds.map(id => ({ id, role: 'REPLICA', healthy: true }));
    this.nextReplicaIndex = 0;
  }

  public setReplicaHealth(replicaId: string, healthy: boolean): void {
    const rep = this.replicas.find(r => r.id === replicaId);
    if (rep) rep.healthy = healthy;
  }

  public routeQuery(sql: string): { targetNodeId: string; role: 'PRIMARY' | 'REPLICA' } {
    const trimmed = sql.trim().toUpperCase();
    const isWrite = trimmed.startsWith('INSERT') ||
                    trimmed.startsWith('UPDATE') ||
                    trimmed.startsWith('DELETE') ||
                    trimmed.startsWith('ALTER') ||
                    trimmed.startsWith('DROP');

    if (isWrite) {
      return { targetNodeId: this.primary.id, role: 'PRIMARY' };
    }

    // Read query: route to healthy replica round-robin, fallback to primary
    const healthyReplicas = this.replicas.filter(r => r.healthy);
    if (healthyReplicas.length === 0) {
      return { targetNodeId: this.primary.id, role: 'PRIMARY' };
    }

    const replica = healthyReplicas[this.nextReplicaIndex % healthyReplicas.length];
    this.nextReplicaIndex++;
    return { targetNodeId: replica.id, role: 'REPLICA' };
  }
}
