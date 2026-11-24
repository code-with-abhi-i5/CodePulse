import { Injectable, Logger } from '@nestjs/common';

export type EndpointHealthStatus = 'ACTIVE' | 'DEGRADED' | 'SUSPENDED';

export interface EndpointStateRecord {
  endpointId: string;
  url: string;
  status: EndpointHealthStatus;
  consecutive5xxFailures: number;
  totalFailures: number;
  totalSuccesses: number;
  lastAttemptStatusCode: number | null;
  lastAttemptTimestamp: number | null;
  suspendedAt: number | null;
  suspensionReason: string | null;
}

@Injectable()
export class EndpointCircuitBreakerService {
  private readonly logger = new Logger(EndpointCircuitBreakerService.name);

  // Maximum consecutive 5xx errors before auto-suspending endpoint
  public static readonly SUSPENSION_THRESHOLD = 50;

  private readonly endpoints = new Map<string, EndpointStateRecord>();

  public registerEndpoint(endpointId: string, url: string): EndpointStateRecord {
    const existing = this.endpoints.get(endpointId);
    if (existing) return existing;

    const record: EndpointStateRecord = {
      endpointId,
      url,
      status: 'ACTIVE',
      consecutive5xxFailures: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      lastAttemptStatusCode: null,
      lastAttemptTimestamp: null,
      suspendedAt: null,
      suspensionReason: null,
    };
    this.endpoints.set(endpointId, record);
    return record;
  }

  /**
   * Records the HTTP status code of a delivery attempt.
   * Auto-suspends endpoint when consecutive 5xx errors reach 50.
   */
  public recordAttempt(endpointId: string, statusCode: number): EndpointHealthStatus {
    let endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      endpoint = this.registerEndpoint(endpointId, `https://webhook.internal/${endpointId}`);
    }

    const now = Date.now();
    endpoint.lastAttemptStatusCode = statusCode;
    endpoint.lastAttemptTimestamp = now;

    if (statusCode >= 200 && statusCode < 300) {
      // Successful delivery
      endpoint.totalSuccesses++;
      endpoint.consecutive5xxFailures = 0;
      endpoint.status = 'ACTIVE';
    } else {
      // Failure
      endpoint.totalFailures++;

      if (statusCode >= 500) {
        endpoint.consecutive5xxFailures++;

        if (endpoint.consecutive5xxFailures >= EndpointCircuitBreakerService.SUSPENSION_THRESHOLD) {
          endpoint.status = 'SUSPENDED';
          endpoint.suspendedAt = now;
          endpoint.suspensionReason = `Auto-suspended after ${endpoint.consecutive5xxFailures} consecutive 5xx failures.`;
          this.logger.error(
            `Endpoint '${endpointId}' (${endpoint.url}) has been SUSPENDED: ${endpoint.suspensionReason}`
          );
        } else if (endpoint.consecutive5xxFailures >= 10) {
          endpoint.status = 'DEGRADED';
        }
      }
    }

    return endpoint.status;
  }

  /**
   * Checks whether the endpoint can accept deliveries.
   */
  public canDispatch(endpointId: string): boolean {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return true;
    return endpoint.status !== 'SUSPENDED';
  }

  /**
   * Manually reactivates a suspended endpoint (e.g. from UI).
   */
  public reactivateEndpoint(endpointId: string): boolean {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return false;

    endpoint.status = 'ACTIVE';
    endpoint.consecutive5xxFailures = 0;
    endpoint.suspendedAt = null;
    endpoint.suspensionReason = null;
    this.logger.log(`Endpoint '${endpointId}' has been manually reactivated via UI.`);
    return true;
  }

  public getEndpointState(endpointId: string): EndpointStateRecord | undefined {
    return this.endpoints.get(endpointId);
  }

  public getSuspendedEndpoints(): EndpointStateRecord[] {
    return Array.from(this.endpoints.values()).filter((e) => e.status === 'SUSPENDED');
  }

  public clear(): void {
    this.endpoints.clear();
  }
}
