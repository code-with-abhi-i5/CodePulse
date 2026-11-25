import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class TenantCorsValidatorService {
  constructor() {
    this.tenantOrigins = new Map();
  }

  registerTenantDomain(tenantId, allowedOrigins) {
    if (!this.tenantOrigins.has(tenantId)) this.tenantOrigins.set(tenantId, new Set());
    const set = this.tenantOrigins.get(tenantId);
    allowedOrigins.forEach(o => set.add(o.toLowerCase()));
  }

  isOriginAllowed(tenantId, requestOrigin) {
    const set = this.tenantOrigins.get(tenantId);
    if (!set) return false;
    return set.has(requestOrigin.toLowerCase());
  }

  getTenantCorsHeaders(tenantId, requestOrigin) {
    if (!this.isOriginAllowed(tenantId, requestOrigin)) return null;
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Credentials': 'true',
    };
  }
}

describe('TenantCorsValidatorService', () => {
  it('isolates multi-tenant CORS boundaries dynamically', () => {
    const service = new TenantCorsValidatorService();
    service.registerTenantDomain('org-1', ['https://app.org1.com']);

    assert.equal(service.isOriginAllowed('org-1', 'https://app.org1.com'), true);
    assert.equal(service.isOriginAllowed('org-1', 'https://malicious.com'), false);
    assert.ok(service.getTenantCorsHeaders('org-1', 'https://app.org1.com') !== null);
  });
});
