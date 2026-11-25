/**
 * Architecture Service: Automated Honeypot Endpoint Detector
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-44]
 */

export class HoneypotVulnerabilityScannerDetectorService {
  private trapPaths: Set<string>;
  private ipOffenseLog: Map<string, { count: number; lastDetected: number; paths: string[]; banned: boolean }>;
  private banThreshold: number;

  constructor(banThreshold: number = 3) {
    this.banThreshold = banThreshold;
    this.trapPaths = new Set([
      '/.env',
      '/.git/config',
      '/wp-login.php',
      '/phpmyadmin',
      '/admin/config.php',
      '/server-status'
    ]);
    this.ipOffenseLog = new Map();
  }

  public inspectRequest(path: string, clientIp: string): { isTrap: boolean; banned: boolean; reason?: string } {
    const normalized = path.toLowerCase().trim();
    if (!this.trapPaths.has(normalized)) {
      const record = this.ipOffenseLog.get(clientIp);
      return { isTrap: false, banned: record?.banned ?? false };
    }

    const now = Date.now();
    const record = this.ipOffenseLog.get(clientIp) || { count: 0, lastDetected: now, paths: [], banned: false };
    record.count++;
    record.lastDetected = now;
    if (!record.paths.includes(normalized)) record.paths.push(normalized);

    if (record.count >= this.banThreshold) {
      record.banned = true;
    }
    this.ipOffenseLog.set(clientIp, record);

    return {
      isTrap: true,
      banned: record.banned,
      reason: `Honeypot trap triggered: ${normalized} (Offenses: ${record.count}/${this.banThreshold})`
    };
  }

  public isIpBanned(clientIp: string): boolean {
    return this.ipOffenseLog.get(clientIp)?.banned ?? false;
  }
}
