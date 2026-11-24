import { Injectable, Logger, Optional } from '@nestjs/common';
import { createHmac, randomUUID } from 'crypto';
import { EndpointCircuitBreakerService } from './endpoint-circuit-breaker.service';

export interface WebhookDeliveryRequest<T = any> {
  deliveryId?: string;
  endpointId: string;
  targetUrl: string;
  secret: string;
  eventType: string;
  payload: T;
  maxRetries?: number;
}

export type WebhookDeliveryStatus = 'PENDING' | 'SUCCESS' | 'RETRYING' | 'SUSPENDED' | 'FAILED_PERMANENT';

export interface WebhookDeliveryRecord<T = any> {
  deliveryId: string;
  endpointId: string;
  targetUrl: string;
  eventType: string;
  payload: T;
  attemptCount: number;
  maxRetries: number;
  status: WebhookDeliveryStatus;
  lastStatusCode: number | null;
  lastError: string | null;
  signature: string;
  timestamp: number;
  nextRetryAt: number | null;
}

export interface WebhookEngineTelemetry {
  totalDeliveriesInitiated: number;
  totalDeliveriesSuccessful: number;
  totalDeliveriesRetried: number;
  totalDeliveriesSuspended: number;
  activePendingRetriesCount: number;
}

export type HttpPostHandler = (
  url: string,
  body: string,
  headers: Record<string, string>,
  timeoutMs: number
) => Promise<{ statusCode: number; data?: string }>;

@Injectable()
export class WebhookDeliveryEngineService {
  private readonly logger = new Logger(WebhookDeliveryEngineService.name);

  // In-memory delivery ledger
  private readonly deliveries = new Map<string, WebhookDeliveryRecord>();
  private httpHandler: HttpPostHandler | null = null;

  // Telemetry counters
  private totalInitiated = 0;
  private totalSuccessful = 0;
  private totalRetried = 0;
  private totalSuspended = 0;

  private readonly circuitBreaker: EndpointCircuitBreakerService;

  constructor(
    @Optional() circuitBreaker?: EndpointCircuitBreakerService
  ) {
    this.circuitBreaker = circuitBreaker || new EndpointCircuitBreakerService();
  }

  public registerHttpHandler(handler: HttpPostHandler): void {
    this.httpHandler = handler;
  }

  /**
   * Generates HMAC-SHA256 signature for payload integrity and authenticity.
   */
  public generateSignature(secret: string, payloadString: string, timestamp: number): string {
    const signaturePayload = `${timestamp}.${payloadString}`;
    return createHmac('sha256', secret).update(signaturePayload).digest('hex');
  }

  /**
   * Verifies incoming webhook signature protecting against forgery and replay attacks.
   */
  public verifySignature(
    secret: string,
    payloadString: string,
    timestamp: number,
    providedSignature: string,
    maxClockSkewMs = 300000 // 5 minutes
  ): boolean {
    const now = Date.now();
    if (Math.abs(now - timestamp) > maxClockSkewMs) {
      this.logger.warn(`Signature verification failed: Clock skew exceeded (${Math.abs(now - timestamp)}ms)`);
      return false;
    }

    const expectedSignature = this.generateSignature(secret, payloadString, timestamp);
    return expectedSignature.toLowerCase() === providedSignature.toLowerCase();
  }

  /**
   * Calculates exponential retry delay with jitter.
   */
  public calculateRetryDelay(attempt: number, baseMs = 1000, capMs = 3600000): number {
    const exponential = Math.min(capMs, baseMs * Math.pow(2, attempt - 1));
    const jitter = Math.floor(Math.random() * (exponential * 0.2));
    return exponential + jitter;
  }

  /**
   * Dispatches a webhook delivery attempt.
   */
  public async dispatchWebhook<T>(request: WebhookDeliveryRequest<T>): Promise<WebhookDeliveryRecord<T>> {
    const deliveryId = request.deliveryId || randomUUID();
    const now = Date.now();
    const payloadStr = JSON.stringify(request.payload);
    const signature = this.generateSignature(request.secret, payloadStr, now);

    this.circuitBreaker.registerEndpoint(request.endpointId, request.targetUrl);

    // 1. Circuit Breaker Suspension Guard
    if (!this.circuitBreaker.canDispatch(request.endpointId)) {
      this.totalSuspended++;
      const suspendedRecord: WebhookDeliveryRecord<T> = {
        deliveryId,
        endpointId: request.endpointId,
        targetUrl: request.targetUrl,
        eventType: request.eventType,
        payload: request.payload,
        attemptCount: 0,
        maxRetries: request.maxRetries ?? 5,
        status: 'SUSPENDED',
        lastStatusCode: null,
        lastError: 'Endpoint is SUSPENDED due to excessive consecutive 5xx errors.',
        signature,
        timestamp: now,
        nextRetryAt: null,
      };
      this.deliveries.set(deliveryId, suspendedRecord);
      return suspendedRecord;
    }

    this.totalInitiated++;

    const record: WebhookDeliveryRecord<T> = {
      deliveryId,
      endpointId: request.endpointId,
      targetUrl: request.targetUrl,
      eventType: request.eventType,
      payload: request.payload,
      attemptCount: 1,
      maxRetries: request.maxRetries ?? 5,
      status: 'PENDING',
      lastStatusCode: null,
      lastError: null,
      signature,
      timestamp: now,
      nextRetryAt: null,
    };
    this.deliveries.set(deliveryId, record);

    return this.executeDeliveryAttempt(record, request.secret);
  }

  /**
   * Manually redelivers a delivery from the UI, reactivating the endpoint if suspended.
   */
  public async manualRedeliver(deliveryId: string, secret = 'secret'): Promise<WebhookDeliveryRecord | null> {
    const record = this.deliveries.get(deliveryId);
    if (!record) return null;

    // Reactivate endpoint in circuit breaker
    this.circuitBreaker.reactivateEndpoint(record.endpointId);

    record.status = 'PENDING';
    record.attemptCount++;
    return this.executeDeliveryAttempt(record, secret);
  }

  public getDelivery(deliveryId: string): WebhookDeliveryRecord | undefined {
    return this.deliveries.get(deliveryId);
  }

  public getTelemetry(): WebhookEngineTelemetry {
    let pendingRetries = 0;
    for (const d of this.deliveries.values()) {
      if (d.status === 'RETRYING') pendingRetries++;
    }

    return {
      totalDeliveriesInitiated: this.totalInitiated,
      totalDeliveriesSuccessful: this.totalSuccessful,
      totalDeliveriesRetried: this.totalRetried,
      totalDeliveriesSuspended: this.totalSuspended,
      activePendingRetriesCount: pendingRetries,
    };
  }

  public clear(): void {
    this.deliveries.clear();
    this.totalInitiated = 0;
    this.totalSuccessful = 0;
    this.totalRetried = 0;
    this.totalSuspended = 0;
    this.circuitBreaker?.clear();
  }

  private async executeDeliveryAttempt(
    record: WebhookDeliveryRecord,
    secret: string
  ): Promise<WebhookDeliveryRecord> {
    const payloadStr = JSON.stringify(record.payload);
    const headers = {
      'Content-Type': 'application/json',
      'X-CodePulse-Delivery': record.deliveryId,
      'X-CodePulse-Event': record.eventType,
      'X-CodePulse-Timestamp': record.timestamp.toString(),
      'X-CodePulse-Signature': record.signature,
    };

    try {
      let statusCode = 200;
      if (this.httpHandler) {
        const resp = await this.httpHandler(record.targetUrl, payloadStr, headers, 5000);
        statusCode = resp.statusCode;
      }

      record.lastStatusCode = statusCode;
      const endpointStatus = this.circuitBreaker.recordAttempt(record.endpointId, statusCode);

      if (statusCode >= 200 && statusCode < 300) {
        record.status = 'SUCCESS';
        record.nextRetryAt = null;
        this.totalSuccessful++;
      } else {
        // Failed attempt
        if (endpointStatus === 'SUSPENDED') {
          record.status = 'SUSPENDED';
          record.nextRetryAt = null;
          this.totalSuspended++;
        } else if (record.attemptCount >= record.maxRetries) {
          record.status = 'FAILED_PERMANENT';
          record.nextRetryAt = null;
        } else {
          record.status = 'RETRYING';
          const delay = this.calculateRetryDelay(record.attemptCount);
          record.nextRetryAt = Date.now() + delay;
          this.totalRetried++;
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      record.lastError = errorMsg;
      record.lastStatusCode = 500;
      const endpointStatus = this.circuitBreaker.recordAttempt(record.endpointId, 500);

      if (endpointStatus === 'SUSPENDED') {
        record.status = 'SUSPENDED';
      } else if (record.attemptCount >= record.maxRetries) {
        record.status = 'FAILED_PERMANENT';
      } else {
        record.status = 'RETRYING';
        this.totalRetried++;
      }
    }

    return record;
  }
}
