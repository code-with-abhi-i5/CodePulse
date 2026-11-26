import { Injectable } from '@nestjs/common';
import { RouteQueryResult } from '../../types/database';

@Injectable()
export class ReadWriteRouterService {
  private primaryNode: string = 'postgres-primary.codepulse.internal';
  private readonly replicas: Map<string, number> = new Map();

  registerReplica(nodeUrl: string, lagMs: number = 0): void {
    this.replicas.set(nodeUrl, lagMs);
  }

  getHealthyReplicas(maxLagMs: number = 200): string[] {
    const list: string[] = [];
    for (const [node, lag] of this.replicas.entries()) {
      if (lag <= maxLagMs) list.push(node);
    }
    return list;
  }

  routeQuery(sql: string, inTransaction: boolean = false): RouteQueryResult {
    const trimmed = sql.trim().toUpperCase();
    const isSelect = trimmed.startsWith('SELECT');

    if (!isSelect || inTransaction) {
      return { target: 'primary', node: this.primaryNode };
    }

    const healthy = this.getHealthyReplicas();
    if (healthy.length === 0) {
      return { target: 'primary', node: this.primaryNode };
    }

    const chosen = healthy[Math.floor(Math.random() * healthy.length)];
    return { target: 'replica', node: chosen };
  }
}
