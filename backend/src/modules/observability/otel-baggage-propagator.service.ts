import { Injectable } from '@nestjs/common';
import { BaggageEntry, TraceContext } from '../../types/observability';

@Injectable()
export class OtelBaggagePropagatorService {
  injectBaggage(existingHeader: string | undefined, entries: BaggageEntry[]): string {
    const map = new Map<string, string>();
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

    return Array.from(map.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
  }

  extractContext(headers: Record<string, string | undefined>): TraceContext {
    const traceparent = headers['traceparent'] || '00-00000000000000000000000000000000-0000000000000000-01';
    const parts = traceparent.split('-');
    const traceId = parts[1] || '00000000000000000000000000000000';
    const spanId = parts[2] || '0000000000000000';
    const traceFlags = parts[3] || '01';

    const baggageHeader = headers['baggage'] || '';
    const baggage: Record<string, string> = {};
    if (baggageHeader) {
      baggageHeader.split(',').forEach(pair => {
        const [k, v] = pair.trim().split('=');
        if (k && v) baggage[k.trim()] = v.trim();
      });
    }

    return { traceId, spanId, traceFlags, baggage };
  }

  createTraceparent(traceId: string, spanId: string, sampled = true): string {
    const flags = sampled ? '01' : '00';
    return `00-${traceId.padStart(32, '0')}-${spanId.padStart(16, '0')}-${flags}`;
  }
}
