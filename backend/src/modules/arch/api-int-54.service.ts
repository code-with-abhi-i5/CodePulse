/**
 * Architecture Service: GraphQL Query Whitelist Firewall
 * Subsystem: API Security & Production Query Hardening
 */

import crypto from 'node:crypto';

export class GraphqlQueryWhitelistFirewallService {
  private readonly whitelistedHashes = new Set<string>();

  public registerApprovedQuery(queryText: string): string {
    const hash = crypto.createHash('sha256').update(queryText.trim()).digest('hex');
    this.whitelistedHashes.add(hash);
    return hash;
  }

  public isQueryApproved(queryText: string): boolean {
    const hash = crypto.createHash('sha256').update(queryText.trim()).digest('hex');
    return this.whitelistedHashes.has(hash);
  }
}
