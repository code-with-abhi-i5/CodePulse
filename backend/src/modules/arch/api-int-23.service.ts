/**
 * Architecture Service: API Key Scoped Permission Token Manager
 * Subsystem: Authentication & Scoped API Access
 */

import crypto from 'node:crypto';

export interface ApiKeyRecord {
  prefix: string;
  hashedSecret: string;
  scopes: string[];
  tenantId: string;
}

export class ApiKeyScopedTokenManagerService {
  private readonly keys = new Map<string, ApiKeyRecord>(); // prefix -> record

  public generateKey(tenantId: string, scopes: string[]): { plaintext: string; prefix: string } {
    const prefix = 'cp_live_' + crypto.randomBytes(4).toString('hex');
    const secret = crypto.randomBytes(24).toString('hex');
    const plaintext = `${prefix}_${secret}`;
    const hashedSecret = crypto.createHash('sha256').update(secret).digest('hex');

    this.keys.set(prefix, { prefix, hashedSecret, scopes, tenantId });
    return { plaintext, prefix };
  }

  public validateKey(plaintext: string, requiredScope?: string): { valid: boolean; tenantId?: string } {
    const parts = plaintext.split('_');
    if (parts.length < 3) return { valid: false };

    const prefix = parts.slice(0, 3).join('_');
    const secret = parts.slice(3).join('_');
    const record = this.keys.get(prefix);
    if (!record) return { valid: false };

    const hash = crypto.createHash('sha256').update(secret).digest('hex');
    if (hash !== record.hashedSecret) return { valid: false };

    if (requiredScope && !record.scopes.includes(requiredScope) && !record.scopes.includes('*')) {
      return { valid: false };
    }

    return { valid: true, tenantId: record.tenantId };
  }
}
