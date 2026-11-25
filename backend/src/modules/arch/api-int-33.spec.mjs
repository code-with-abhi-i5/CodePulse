import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GrpcClientLoadBalancerService } from './api-int-33.service.ts';

describe('GrpcClientLoadBalancerService (API-INT-33)', () => {
  it('balances requests across healthy endpoints using round-robin distribution', () => {
    const lb = new GrpcClientLoadBalancerService();
    lb.addEndpoint('10.0.0.1:50051');
    lb.addEndpoint('10.0.0.2:50051');

    assert.strictEqual(lb.getNextEndpoint(), '10.0.0.1:50051');
    assert.strictEqual(lb.getNextEndpoint(), '10.0.0.2:50051');

    // Mark 10.0.0.1 unhealthy
    lb.setHealth('10.0.0.1:50051', false);
    assert.strictEqual(lb.getNextEndpoint(), '10.0.0.2:50051');
  });
});
