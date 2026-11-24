import { EndpointCircuitBreakerService } from './endpoint-circuit-breaker.service';
import {
  WebhookDeliveryEngineService,
  WebhookDeliveryRequest,
} from './webhook-delivery-engine.service';

describe('WebhookDeliveryEngineService (#1417)', () => {
  let circuitBreaker: EndpointCircuitBreakerService;
  let engine: WebhookDeliveryEngineService;

  beforeEach(() => {
    circuitBreaker = new EndpointCircuitBreakerService();
    engine = new WebhookDeliveryEngineService(circuitBreaker);
  });

  afterEach(() => {
    engine.clear();
  });

  describe('Cryptographic Signing & Replay Protection', () => {
    it('should generate reproducible HMAC-SHA256 signature for payload and timestamp', () => {
      const secret = 'whsec_test_secret_key_123';
      const payload = JSON.stringify({ event: 'challenge.completed', user: 'alice' });
      const timestamp = 1700000000000;

      const sig1 = engine.generateSignature(secret, payload, timestamp);
      const sig2 = engine.generateSignature(secret, payload, timestamp);

      expect(sig1).toHaveLength(64);
      expect(sig1).toBe(sig2);
    });

    it('should verify valid signature within acceptable clock skew (5 minutes)', () => {
      const secret = 'whsec_test_secret_key_123';
      const payload = JSON.stringify({ action: 'ping' });
      const now = Date.now();
      const sig = engine.generateSignature(secret, payload, now);

      expect(engine.verifySignature(secret, payload, now, sig)).toBe(true);
    });

    it('should reject forged signature or clock skew exceeding 5 minutes', () => {
      const secret = 'whsec_test_secret_key_123';
      const payload = JSON.stringify({ action: 'ping' });
      const now = Date.now();
      const validSig = engine.generateSignature(secret, payload, now);

      // Tampered payload
      expect(engine.verifySignature(secret, 'tampered_payload', now, validSig)).toBe(false);

      // Expired timestamp (10 minutes ago)
      const staleTimestamp = now - 600000;
      expect(engine.verifySignature(secret, payload, staleTimestamp, validSig)).toBe(false);
    });
  });

  describe('Endpoint Auto-Suspension & Circuit Breaker', () => {
    it('should auto-suspend endpoint after 50 consecutive 5xx failures', () => {
      const endpointId = 'ep-failing-101';
      circuitBreaker.registerEndpoint(endpointId, 'https://example.com/webhook');

      // 49 consecutive 500 errors - should be DEGRADED, not yet SUSPENDED
      for (let i = 0; i < 49; i++) {
        circuitBreaker.recordAttempt(endpointId, 502);
      }
      expect(circuitBreaker.getEndpointState(endpointId)?.status).toBe('DEGRADED');
      expect(circuitBreaker.canDispatch(endpointId)).toBe(true);

      // 50th consecutive failure triggers SUSPENDED
      circuitBreaker.recordAttempt(endpointId, 500);
      expect(circuitBreaker.getEndpointState(endpointId)?.status).toBe('SUSPENDED');
      expect(circuitBreaker.canDispatch(endpointId)).toBe(false);
    });

    it('should block new dispatches when endpoint is SUSPENDED', async () => {
      const endpointId = 'ep-suspended';
      circuitBreaker.registerEndpoint(endpointId, 'https://api.external.com/hook');

      for (let i = 0; i < 50; i++) {
        circuitBreaker.recordAttempt(endpointId, 503);
      }

      const req: WebhookDeliveryRequest = {
        endpointId,
        targetUrl: 'https://api.external.com/hook',
        secret: 'whsec_abc',
        eventType: 'build.failed',
        payload: { id: 1 },
      };

      const result = await engine.dispatchWebhook(req);
      expect(result.status).toBe('SUSPENDED');
      expect(result.lastError).toContain('Endpoint is SUSPENDED');
    });

    it('should allow manual redelivery and reactivate suspended endpoint', async () => {
      const endpointId = 'ep-recovered';
      circuitBreaker.registerEndpoint(endpointId, 'https://recovered.com/hook');
      for (let i = 0; i < 50; i++) {
        circuitBreaker.recordAttempt(endpointId, 500);
      }
      expect(circuitBreaker.canDispatch(endpointId)).toBe(false);

      // Create a suspended delivery
      const req: WebhookDeliveryRequest = {
        deliveryId: 'del-101',
        endpointId,
        targetUrl: 'https://recovered.com/hook',
        secret: 'whsec_recovered',
        eventType: 'test.event',
        payload: { ok: true },
      };
      await engine.dispatchWebhook(req);

      // Configure HTTP mock to respond 200 OK
      engine.registerHttpHandler(async () => ({ statusCode: 200, data: 'OK' }));

      // Execute manual redelivery via UI action
      const redelivered = await engine.manualRedeliver('del-101', 'whsec_recovered');

      expect(redelivered).not.toBeNull();
      expect(redelivered?.status).toBe('SUCCESS');
      expect(circuitBreaker.canDispatch(endpointId)).toBe(true);
      expect(circuitBreaker.getEndpointState(endpointId)?.status).toBe('ACTIVE');
    });
  });

  describe('Exponential Retry & Backoff Schedule', () => {
    it('should calculate exponential retry delay with jitter bounds', () => {
      const delay1 = engine.calculateRetryDelay(1, 1000);
      const delay2 = engine.calculateRetryDelay(2, 1000);
      const delay3 = engine.calculateRetryDelay(3, 1000);

      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay3).toBeGreaterThanOrEqual(4000);
    });

    it('should transition to RETRYING on transient 5xx error when retries remain', async () => {
      engine.registerHttpHandler(async () => ({ statusCode: 504, data: 'Gateway Timeout' }));

      const req: WebhookDeliveryRequest = {
        endpointId: 'ep-transient',
        targetUrl: 'https://transient.com/hook',
        secret: 'whsec_transient',
        eventType: 'repo.pushed',
        payload: { commit: 'abc' },
        maxRetries: 3,
      };

      const result = await engine.dispatchWebhook(req);
      expect(result.status).toBe('RETRYING');
      expect(result.nextRetryAt).not.toBeNull();

      const telemetry = engine.getTelemetry();
      expect(telemetry.totalDeliveriesRetried).toBe(1);
    });
  });
});
