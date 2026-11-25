/**
 * Architecture Service: Connection Pool SSL Certificate Auto-Reload
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-55]
 */

import crypto from 'node:crypto';

export class DatabasePoolSslAutoReloadService {
  private currentCertHash: string | null;

  constructor() {
    this.currentCertHash = null;
  }

  public checkForReload(certPem: string): { reloaded: boolean; certHash: string } {
    const hash = crypto.createHash('sha256').update(certPem).digest('hex');

    if (this.currentCertHash === null) {
      this.currentCertHash = hash;
      return { reloaded: false, certHash: hash };
    }

    if (this.currentCertHash !== hash) {
      this.currentCertHash = hash;
      return { reloaded: true, certHash: hash };
    }

    return { reloaded: false, certHash: hash };
  }
}
