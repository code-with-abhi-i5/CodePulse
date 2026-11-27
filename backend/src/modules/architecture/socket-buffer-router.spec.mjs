import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ZeroCopySocketBufferRouter } from './socket-buffer-router.service.ts';

describe('ZeroCopySocketBufferRouter [ARCH-CORE-021]', () => {
  const router = new ZeroCopySocketBufferRouter();

  test('encodes and zero-copy decodes frame parsing channel and payload', () => {
    const rawPayload = Buffer.from('console.log("tournament live")');
    const framed = router.createFrame(42, 1, rawPayload);

    const parsed = router.parseFrame(framed);
    assert.ok(parsed);
    assert.equal(parsed.channelId, 42);
    assert.equal(parsed.messageType, 1);
    assert.equal(parsed.payloadLength, rawPayload.length);
    assert.equal(parsed.payload.toString(), rawPayload.toString());
  });

  test('rejects buffers missing magic bytes or incomplete payload', () => {
    const invalid = Buffer.from([0x00, 0x01, 0x02]);
    assert.equal(router.parseFrame(invalid), null);
  });
});
