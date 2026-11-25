import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class ReadWriteRouterService {
  constructor() {
    this.primaryNode = 'postgres-primary.codepulse.internal';
    this.replicas = new Map();
  }

  registerReplica(nodeUrl, lagMs = 0) {
    this.replicas.set(nodeUrl, lagMs);
  }

  getHealthyReplicas(maxLagMs = 200) {
    const list = [];
    for (const [node, lag] of this.replicas.entries()) {
      if (lag <= maxLagMs) list.push(node);
    }
    return list;
  }

  routeQuery(sql, inTransaction = false) {
    const trimmed = sql.trim().toUpperCase();
    const isSelect = trimmed.startsWith('SELECT');
    if (!isSelect || inTransaction) {
      return { target: 'primary', node: this.primaryNode };
    }
    const healthy = this.getHealthyReplicas();
    if (healthy.length === 0) {
      return { target: 'primary', node: this.primaryNode };
    }
    const chosen = healthy[0];
    return { target: 'replica', node: chosen };
  }
}

describe('ReadWriteRouterService', () => {
  it('correctly splits read and write queries, respecting transaction boundaries', () => {
    const service = new ReadWriteRouterService();
    service.registerReplica('replica-1', 15);
    service.registerReplica('replica-laggy', 500);

    assert.equal(service.routeQuery('SELECT * FROM submissions').target, 'replica');
    assert.equal(service.routeQuery('UPDATE users SET elo = 1200').target, 'primary');
    assert.equal(service.routeQuery('SELECT * FROM users FOR UPDATE', true).target, 'primary');
  });
});
