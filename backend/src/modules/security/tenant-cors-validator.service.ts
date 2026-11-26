import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantCorsValidatorService {
  private readonly tenantOrigins: Map<string, Set<string>> = new Map();

  registerTenantDomain(tenantId: string, allowedOrigins: string[]): void {
    if (!this.tenantOrigins.has(tenantId)) {
      this.tenantOrigins.set(tenantId, new Set());
    }
    const set = this.tenantOrigins.get(tenantId)!;
    allowedOrigins.forEach(o => set.add(o.toLowerCase()));
  }

  isOriginAllowed(tenantId: string, requestOrigin: string): boolean {
    const set = this.tenantOrigins.get(tenantId);
    if (!set) return false;
    return set.has(requestOrigin.toLowerCase());
  }

  getTenantCorsHeaders(tenantId: string, requestOrigin: string): Record<string, string> | null {
    if (!this.isOriginAllowed(tenantId, requestOrigin)) {
      return null;
    }
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Tenant-ID',
    };
  }
}
