import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MicroserviceDependencyCycleBreaker } from './dependency-cycle-breaker.service.ts';

describe('MicroserviceDependencyCycleBreaker [ARCH-CORE-011]', () => {
  const breaker = new MicroserviceDependencyCycleBreaker();

  test('propagates call chain cleanly across acyclic microservice dependencies', () => {
    const step1 = breaker.traceCall('api-gateway');
    assert.equal(step1.allowed, true);

    const step2 = breaker.traceCall('auth-service', step1.newCallStack);
    assert.equal(step2.allowed, true);

    const step3 = breaker.traceCall('database-service', step2.newCallStack);
    assert.equal(step3.allowed, true);
    assert.equal(step3.newCallStack, 'api-gateway->auth-service->database-service');
  });

  test('intercepts and breaks cyclic RPC call loop', () => {
    const stack = 'api-gateway->auth-service->user-service';
    const result = breaker.traceCall('auth-service', stack); // Loop back to auth-service!
    assert.equal(result.allowed, false);
    assert.ok(result.error?.includes('RPC Cycle detected'));
  });
});
