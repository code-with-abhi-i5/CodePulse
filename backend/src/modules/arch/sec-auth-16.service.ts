/**
 * Architecture Service: Content Security Policy (CSP) Dynamic Nonce & Reporting
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-16]
 */

import crypto from 'node:crypto';

export interface CspViolationReport {
  documentUri: string;
  blockedUri: string;
  violatedDirective: string;
  originalPolicy: string;
}

export class CspNonceAndReporterService {
  private violationLog: CspViolationReport[];

  constructor() {
    this.violationLog = [];
  }

  public generatePerRequestNonce(): { nonce: string; cspHeaderValue: string } {
    const nonce = crypto.randomBytes(16).toString('base64');
    const cspHeaderValue = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; object-src 'none'; frame-ancestors 'none';`;

    return { nonce, cspHeaderValue };
  }

  public recordViolation(report: CspViolationReport): void {
    this.violationLog.push(report);
  }

  public getViolationsCount(): number {
    return this.violationLog.length;
  }
}
