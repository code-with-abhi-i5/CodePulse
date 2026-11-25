import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GrpcErrorMappingInterceptorService, GrpcStatus } from './api-int-27.service.ts';

describe('GrpcErrorMappingInterceptorService (API-INT-27)', () => {
  it('correctly maps HTTP status codes to standard gRPC status codes', () => {
    const mapper = new GrpcErrorMappingInterceptorService();

    assert.strictEqual(mapper.mapHttpToGrpc(404), GrpcStatus.NOT_FOUND);
    assert.strictEqual(mapper.mapHttpToGrpc(401), GrpcStatus.UNAUTHENTICATED);
    assert.strictEqual(mapper.mapHttpToGrpc(429), GrpcStatus.RESOURCE_EXHAUSTED);
    assert.strictEqual(mapper.mapHttpToGrpc(500), GrpcStatus.UNKNOWN);
  });
});
