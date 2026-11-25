/**
 * Architecture Service: Session Hijacking Anomaly Detector
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-11]
 */

export interface SessionContext {
  fingerprintHash: string;
  ipAddress: string;
  lastActivityTimestamp: number;
}

export class SessionHijackingDetectorService {
  public evaluateRequest(
    stored: SessionContext,
    incoming: { fingerprintHash: string; ipAddress: string; timestamp: number }
  ): { isSuspicious: boolean; reason?: string } {
    if (stored.fingerprintHash !== incoming.fingerprintHash) {
      return {
        isSuspicious: true,
        reason: 'Device fingerprint anomaly: User-Agent/device properties changed during active session'
      };
    }

    // Check subnet jumping
    const storedSubnet = this.getSubnet(stored.ipAddress);
    const incomingSubnet = this.getSubnet(incoming.ipAddress);

    if (storedSubnet !== incomingSubnet) {
      const elapsedSec = (incoming.timestamp - stored.lastActivityTimestamp) / 1000;
      if (elapsedSec < 30) {
        return {
          isSuspicious: true,
          reason: `Geographic impossible speed anomaly: IP jumped subnets within ${elapsedSec}s`
        };
      }
    }

    return { isSuspicious: false };
  }

  private getSubnet(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    return ip;
  }
}
