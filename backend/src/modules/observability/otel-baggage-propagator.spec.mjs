import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class OtelBaggagePropagatorService {
  injectBaggage(existingHeader, entries) {
    const map = new Map();
    if (existingHeader) {
      existingHeader.split(',').forEach(item => {
        const [k, v] = item.trim().split('=');
        if (k && v) map.set(k.trim(), v.trim());
      });
    }
    for (const entry of entries) {
      const sanitizedKey = entry.key.trim().replace(/[^a-zA-Z0-9._-]/g, '');
      const sanitizedVal = entry.value.trim().replace(/[^a-zA-Z0-9._-]/g, '');
      if (sanitizedKey && sanitizedVal) {
        map.set(sanitizedKey, sanitizedVal);
      }
    }
    return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join(', ');
  }

  extractContext(headers) {
    const traceparent = headers['traceparent'] || '00-00000000000000000000000000000000-0000000000000000-01';
    const parts = traceparent.split('-');
    const traceId = parts[1] || '00000000000000000000000000000000';
    const spanId = parts[2] || '0000000000000000';
    const traceFlags = parts[3] || '01';
    const baggageHeader = headers['baggage'] || '';
    const baggage = {};
    if (baggageHeader) {
      baggageHeader.split(',').forEach(pair => {
        const [k, v] = pair.trim().split('=');
        if (k && v) baggage[k.trim()] = v.trim();
      });
    }
    return { traceId, spanId, traceFlags, baggage };
  }

  createTraceparent(traceId, spanId, sampled = true) {
    const flags = sampled ? '01' : '00';
    return `00-${traceId.padStart(32, '0')}-${spanId.padStart(16, '0')}-${flags}`;
  }
}

describe('OtelBaggagePropagatorService', () => {
  const service = new OtelBaggagePropagatorService();

  it('injects and extracts W3C baggage header with tenant and user tags', () => {
    const baggageHeader = service.injectBaggage(undefined, [
      { key: 'tenant.id', value: 'acme-corp' },
      { key: 'user.id', value: 'usr_12345' }
    ]);
    assert.ok(baggageHeader.includes('tenant.id=acme-corp'));
    assert.ok(baggageHeader.includes('user.id=usr_12345'));

    const traceparent = service.createTraceparent('abcdef1234567890abcdef1234567890', '1234567890abcdef', true);
    const ctx = service.extractContext({ traceparent, baggage: baggageHeader });
    assert.strictEqual(ctx.traceId, 'abcdef1234567890abcdef1234567890');
    assert.strictEqual(ctx.spanId, '1234567890abcdef');
    assert.strictEqual(ctx.baggage['tenant.id'], 'acme-corp');
    assert.strictEqual(ctx.baggage['user.id'], 'usr_12345');
  });

  it('updates existing baggage without losing existing keys', () => {
    const updated = service.injectBaggage('env=production, region=us-east-1', [
      { key: 'tenant.id', value: 'tenant_omega' }
    ]);
    assert.ok(updated.includes('env=production'));
    assert.ok(updated.includes('region=us-east-1'));
    assert.ok(updated.includes('tenant.id=tenant_omega'));
  });
});
