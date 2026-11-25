import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SseStreamingGatewayService } from './api-int-20.service.ts';

describe('SseStreamingGatewayService (API-INT-20)', () => {
  it('formats compliant Server-Sent Events frames for streaming compilation logs', () => {
    const gateway = new SseStreamingGatewayService();
    const frame = gateway.formatMessage({
      id: 'log-101',
      event: 'compilation_log',
      data: 'Compiling target module...\nCompilation succeeded.'
    });

    assert.strictEqual(
      frame,
      'id: log-101\nevent: compilation_log\ndata: Compiling target module...\ndata: Compilation succeeded.\n\n'
    );
  });
});
