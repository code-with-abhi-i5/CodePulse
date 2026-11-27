import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocketTraceContextService } from './websocket-trace-context.service.ts';

describe('WebSocketTraceContextService [ARCH-CORE-039]', () => {
  const service = new WebSocketTraceContextService();

  test('generates valid W3C traceparent string and parses correctly', () => {
    const header = service.createTraceparent();
    const parsed = service.parseTraceparent(header);
    assert.ok(parsed);
    assert.equal(parsed.traceId.length, 32);
    assert.equal(parsed.spanId.length, 16);
    assert.equal(parsed.traceFlags, '01');
  });

  test('extracts context from HTTP headers with tracestate and baggage', () => {
    const headers = {
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      tracestate: 'congo=t61rcWkgMzE,rojo=00f067aa0ba902b7',
      baggage: 'userId=challenger-99,env=prod'
    };
    const ctx = service.extractFromHeaders(headers);
    assert.equal(ctx.traceId, '4bf92f3577b34da6a3ce929d0e0e4736');
    assert.equal(ctx.spanId, '00f067aa0ba902b7');
    assert.equal(ctx.baggage?.userId, 'challenger-99');
    assert.equal(ctx.baggage?.env, 'prod');
  });

  test('creates downstream child span keeping traceId but generating new spanId', () => {
    const parent = service.extractFromHeaders({});
    const child = service.createChildSpan(parent);
    assert.equal(child.traceId, parent.traceId);
    assert.notEqual(child.spanId, parent.spanId);
  });

  test('injects trace into websocket payload object', () => {
    const ctx = {
      traceId: '12345678901234567890123456789012',
      spanId: '1234567890123456',
      traceFlags: '01'
    };
    const frame = service.injectIntoWebSocketFrame({ action: 'SUBMIT_CODE' }, ctx);
    assert.equal(frame.action, 'SUBMIT_CODE');
    assert.ok(frame._trace.traceparent.includes('12345678901234567890123456789012'));
  });
});
