/**
 * Architecture Service: Device Authorization Grant (RFC 8628) Provider
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-31]
 */

import crypto from 'node:crypto';

export interface DeviceSession {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresAt: number;
  intervalSec: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  userId?: string;
}

export class DeviceAuthorizationGrantService {
  private sessions: Map<string, DeviceSession>;
  private userCodeMap: Map<string, string>; // userCode -> deviceCode

  constructor() {
    this.sessions = new Map();
    this.userCodeMap = new Map();
  }

  public initiateDeviceFlow(verificationUri: string = 'https://codepulse.io/activate'): DeviceSession {
    const deviceCode = crypto.randomBytes(24).toString('hex');
    const userCode = `${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const session: DeviceSession = {
      deviceCode,
      userCode,
      verificationUri,
      expiresAt: Date.now() + 600000, // 10 mins
      intervalSec: 5,
      status: 'PENDING'
    };

    this.sessions.set(deviceCode, session);
    this.userCodeMap.set(userCode, deviceCode);
    return session;
  }

  public approveUserCode(userCode: string, userId: string): boolean {
    const deviceCode = this.userCodeMap.get(userCode);
    if (!deviceCode) return false;
    const session = this.sessions.get(deviceCode);
    if (!session || Date.now() > session.expiresAt) return false;

    session.status = 'APPROVED';
    session.userId = userId;
    return true;
  }

  public pollDeviceToken(deviceCode: string): { status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED'; token?: string } {
    const session = this.sessions.get(deviceCode);
    if (!session || Date.now() > session.expiresAt) {
      return { status: 'EXPIRED' };
    }

    if (session.status === 'APPROVED') {
      const token = `cp_dev_${crypto.randomBytes(24).toString('hex')}`;
      this.sessions.delete(deviceCode);
      return { status: 'APPROVED', token };
    }

    return { status: session.status };
  }
}
