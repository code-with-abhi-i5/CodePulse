import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RestHateoasLinkGeneratorService } from './api-int-52.service.ts';

describe('RestHateoasLinkGeneratorService (API-INT-52)', () => {
  it('enriches domain resources with contextual hypermedia links', () => {
    const hateoas = new RestHateoasLinkGeneratorService('https://api.test.io');
    const enriched = hateoas.enrichChallenge({ id: 'chal-10', title: 'DP Problem' });

    assert.strictEqual(enriched._links.self.href, 'https://api.test.io/challenges/chal-10');
    assert.strictEqual(enriched._links.submit.method, 'POST');
  });
});
