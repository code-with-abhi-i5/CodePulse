/**
 * Architecture Service: GraphQL Persisted Queries Engine
 * Subsystem: GraphQL Optimization & Payload Compression
 */

import crypto from 'node:crypto';

export class GraphqlPersistedQueriesService {
  private readonly queryStore = new Map<string, string>(); // hash -> queryText

  public registerQuery(queryText: string): string {
    const hash = crypto.createHash('sha256').update(queryText.trim()).digest('hex');
    this.queryStore.set(hash, queryText.trim());
    return hash;
  }

  public resolveQuery(hash: string): string | null {
    return this.queryStore.get(hash) ?? null;
  }

  public hasQuery(hash: string): boolean {
    return this.queryStore.has(hash);
  }
}
