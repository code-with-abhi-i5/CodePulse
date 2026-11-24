import { Injectable, Logger } from '@nestjs/common';
import { PiiMaskerService } from './pii-masker.service';

export interface AuditLogEntry {
  auditId: string;
  timestamp: Date;
  method: string;
  route: string;
  statusCode: number;
  ip: string;
  userId?: string;
  requestPayloadMasked?: any;
  responsePayloadMasked?: any;
  durationMs: number;
  maskingDurationUs: number;
}

@Injectable()
export class PayloadAuditLoggerService {
  private readonly logger = new Logger(PayloadAuditLoggerService.name);
  private readonly auditLogBuffer: AuditLogEntry[] = [];
  private readonly MAX_AUDIT_LOGS = 2000;

  constructor(private readonly piiMasker: PiiMaskerService) {}

  /**
   * Intercepts and logs an HTTP transaction with 100% PII masked payloads.
   */
  public logTransaction(
    method: string,
    route: string,
    statusCode: number,
    ip: string,
    requestBody: any,
    responseBody: any,
    durationMs: number,
    userId?: string,
  ): AuditLogEntry {
    const { masked: maskedReq, stats: reqStats } = this.piiMasker.maskPayload(requestBody);
    const { masked: maskedRes, stats: resStats } = this.piiMasker.maskPayload(responseBody);

    const entry: AuditLogEntry = {
      auditId: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date(),
      method,
      route,
      statusCode,
      ip,
      userId,
      requestPayloadMasked: maskedReq,
      responsePayloadMasked: maskedRes,
      durationMs,
      maskingDurationUs: reqStats.durationUs + resStats.durationUs,
    };

    this.auditLogBuffer.push(entry);
    if (this.auditLogBuffer.length > this.MAX_AUDIT_LOGS) {
      this.auditLogBuffer.shift();
    }

    return entry;
  }

  public getRecentAuditLogs(limit = 50): AuditLogEntry[] {
    return this.auditLogBuffer.slice(-limit);
  }

  public getBufferSize(): number {
    return this.auditLogBuffer.length;
  }
}
