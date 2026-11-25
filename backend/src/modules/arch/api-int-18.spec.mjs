import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WebhookEndpointHealthScannerService } from './api-int-18.service.ts';

describe('WebhookEndpointHealthScannerService (API-INT-18)', () => {
  it('monitors webhook endpoint health and deactivates endpoints after consecutive failures', () => {
    const scanner = new WebhookEndpointHealthScannerService(3);
    const url = 'https://api.subscriber.io/events';

    scanner.recordDeliveryResult(url, false);
    assert.strictEqual(scanner.isEndpointActive(url), true);

    scanner.recordDeliveryResult(url, false);
    assert.strictEqual(scanner.isEndpointActive(url), true);

    scanner.recordDeliveryResult(url, false);
    assert.strictEqual(scanner.isEndpointActive(url), false); // Disabled after 3 failures
  });
});
