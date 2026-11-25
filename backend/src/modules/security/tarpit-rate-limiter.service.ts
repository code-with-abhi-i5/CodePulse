import { Injectable } from '@nestjs/common';
import { RateLimitStatus } from '../../types/security';

@Injectable()
export class TarpitRateLimiterService {
  private readonly ipLogs: Map<string, number[]> = new Map();
  private readonly honeypotIps: Set<string> = new Set();
  private readonly windowMs: number = 60000;
  private readonly limit: number = 60;

  flagHoneypotHit(ip: string): void {
    this.honeypotIps.add(ip);
  }

  recordHit(ip: string): RateLimitStatus {
    const now = Date.now();
    if (!this.ipLogs.has(ip)) {
      this.ipLogs.set(ip, []);
    }
    const timestamps = this.ipLogs.get(ip)!;
    while (timestamps.length > 0 && timestamps[0] <= now - this.windowMs) {
      timestamps.shift();
    }
    timestamps.push(now);

    const isHoneypot = this.honeypotIps.has(ip);
    const reputation = isHoneypot ? 0 : Math.max(0, 100 - timestamps.length);
    const allowed = timestamps.length <= this.limit && !isHoneypot;
    const delayMs = isHoneypot ? 5000 : (timestamps.length > this.limit ? 2000 : 0);

    return { allowed, delayMs, reputation };
  }
}
