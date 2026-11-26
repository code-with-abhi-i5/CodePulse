import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { RefreshTokenRecord } from '../../types/security';

@Injectable()
export class JwtTokenRotatorService {
  private readonly revokedHashes: Set<string> = new Set();

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  issueRefreshToken(userId: string): RefreshTokenRecord {
    const token = `rt_${userId}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const hash = this.hashToken(token);
    return { token, hash };
  }

  rotateRefreshToken(oldToken: string, userId: string): { success: boolean; newToken?: string } {
    if (this.isRevoked(oldToken)) {
      return { success: false };
    }
    this.revokeToken(oldToken);
    const next = this.issueRefreshToken(userId);
    return { success: true, newToken: next.token };
  }

  revokeToken(token: string): void {
    this.revokedHashes.add(this.hashToken(token));
  }

  isRevoked(token: string): boolean {
    return this.revokedHashes.has(this.hashToken(token));
  }
}
