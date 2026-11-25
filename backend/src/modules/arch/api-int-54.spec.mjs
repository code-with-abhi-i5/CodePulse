import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GraphqlQueryWhitelistFirewallService } from './api-int-54.service.ts';

describe('GraphqlQueryWhitelistFirewallService (API-INT-54)', () => {
  it('blocks unapproved ad-hoc queries and allows whitelisted query signatures', () => {
    const firewall = new GraphqlQueryWhitelistFirewallService();
    firewall.registerApprovedQuery('query GetChallenges { challenges { id } }');

    assert.strictEqual(firewall.isQueryApproved('query GetChallenges { challenges { id } }'), true);
    assert.strictEqual(firewall.isQueryApproved('query AdHocIntrospection { __schema { types { name } } }'), false);
  });
});
