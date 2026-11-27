import crypto from 'crypto';

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: string;
  tracestate?: string;
  baggage?: Record<string, string>;
}

export class WebSocketTraceContextService {
  public generateTraceId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  public generateSpanId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  public createTraceparent(ctx: Partial<TraceContext> = {}): string {
    const traceId = ctx.traceId || this.generateTraceId();
    const spanId = ctx.spanId || this.generateSpanId();
    const flags = ctx.traceFlags || '01'; // sampled by default
    return `00-${traceId}-${spanId}-${flags}`;
  }

  public parseTraceparent(headerVal?: string | null): TraceContext | null {
    if (!headerVal) return null;
    const parts = headerVal.trim().split('-');
    if (parts.length !== 4) return null;
    const [version, traceId, spanId, flags] = parts;
    if (version !== '00') return null;
    if (!/^[0-9a-f]{32}$/i.test(traceId) || traceId === '00000000000000000000000000000000') return null;
    if (!/^[0-9a-f]{16}$/i.test(spanId) || spanId === '0000000000000000') return null;
    if (!/^[0-9a-f]{2}$/i.test(flags)) return null;

    return {
      traceId: traceId.toLowerCase(),
      spanId: spanId.toLowerCase(),
      traceFlags: flags.toLowerCase()
    };
  }

  public injectIntoHeaders(headers: Record<string, string | string[]>, ctx: TraceContext): Record<string, string | string[]> {
    const result = { ...headers };
    result['traceparent'] = `00-${ctx.traceId}-${ctx.spanId}-${ctx.traceFlags}`;
    if (ctx.tracestate) {
      result['tracestate'] = ctx.tracestate;
    }
    if (ctx.baggage && Object.keys(ctx.baggage).length > 0) {
      result['baggage'] = Object.entries(ctx.baggage)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join(',');
    }
    return result;
  }

  public extractFromHeaders(headers: Record<string, string | string[] | undefined>): TraceContext {
    const traceparentHeader = (headers['traceparent'] || headers['TRACEPARENT']) as string | undefined;
    const parsed = this.parseTraceparent(traceparentHeader);
    
    if (parsed) {
      const tracestate = (headers['tracestate'] || headers['TRACESTATE']) as string | undefined;
      const baggageHeader = (headers['baggage'] || headers['BAGGAGE']) as string | undefined;
      const baggage: Record<string, string> = {};
      if (baggageHeader) {
        baggageHeader.split(',').forEach(pair => {
          const [k, v] = pair.split('=').map(s => s?.trim());
          if (k && v) {
            baggage[decodeURIComponent(k)] = decodeURIComponent(v);
          }
        });
      }
      return { ...parsed, tracestate, baggage };
    }

    // Root span fallback
    return {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      traceFlags: '01',
      baggage: {}
    };
  }

  public createChildSpan(parent: TraceContext): TraceContext {
    return {
      traceId: parent.traceId,
      spanId: this.generateSpanId(),
      traceFlags: parent.traceFlags,
      tracestate: parent.tracestate,
      baggage: { ...parent.baggage }
    };
  }

  public injectIntoWebSocketFrame(payload: Record<string, any>, ctx: TraceContext): Record<string, any> {
    return {
      ...payload,
      _trace: {
        traceparent: this.createTraceparent(ctx),
        tracestate: ctx.tracestate,
        baggage: ctx.baggage
      }
    };
  }
}
