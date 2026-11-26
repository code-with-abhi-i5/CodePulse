import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class HmacWebhookVerifierService {
  constructor(signingSecret = 'webhook-hmac-signing-secret', maxDriftMs = 300000) {
    this.signingSecret = signingSecret;
    this.maxDriftMs = maxDriftMs;
  }

  signPayload(payloadString, timestamp = Date.now()) {
    const signature = crypto.createHmac('sha256', this.signingSecret).update(timestamp + '.' + payloadString).digest('hex');
    return 't=' + timestamp + ',v1=' + signature;
  }

  verifyHeader(headerValue, payloadString, now = Date.now()) {
    const match = headerValue.match(/t=(\d+),v1=([a-f0-9]+)/);
    if (!match) {
      return { isValid: false, timestampDriftMs: 0, reason: 'Malformed signature header format' };
    }

    const timestamp = parseInt(match[1], 10);
    const signature = match[2];
    const timestampDriftMs = Math.abs(now - timestamp);

    if (timestampDriftMs > this.maxDriftMs) {
      return { isValid: false, timestampDriftMs, reason: 'Timestamp drift exceeds tolerance' };
    }

    const expectedSig = crypto.createHmac('sha256', this.signingSecret).update(timestamp + '.' + payloadString).digest('hex');
    const isValid = signature.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));

    return {
      isValid,
      timestampDriftMs,
      reason: isValid ? undefined : 'HMAC signature mismatch'
    };
  }
}

describe('HmacWebhookVerifierService', () => {
  const verifier = new HmacWebhookVerifierService('webhook-secret', 60000);

  it('signs and verifies authentic outbound webhook payloads', () => {
    const payload = JSON.stringify({ event: 'tournament.finished', id: 42 });
    const header = verifier.signPayload(payload, 1000);

    const res = verifier.verifyHeader(header, payload, 2000);
    assert.equal(res.isValid, true);
    assert.equal(res.timestampDriftMs, 1000);
  });

  it('rejects stale webhook requests exceeding timestamp drift', () => {
    const payload = JSON.stringify({ event: 'ping' });
    const header = verifier.signPayload(payload, 1000);

    const res = verifier.verifyHeader(header, payload, 200000);
    assert.equal(res.isValid, false);
    assert.ok(res.reason.includes('Timestamp drift'));
  });

  it('rejects tampered webhook payloads', () => {
    const payload = JSON.stringify({ event: 'user.created', role: 'USER' });
    const header = verifier.signPayload(payload, 1000);

    const tampered = JSON.stringify({ event: 'user.created', role: 'ADMIN' });
    const res = verifier.verifyHeader(header, tampered, 2000);
    assert.equal(res.isValid, false);
    assert.ok(res.reason.includes('signature mismatch'));
  });
});
