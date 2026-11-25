/**
 * Architecture Service: Tier-Based Dynamic API Request Size Limiter
 * Subsystem: API Gateway Quota & Tier Management
 */

export class ApiDynamicPayloadLimiterService {
  private readonly tierLimits: Record<string, number> = {
    FREE: 1 * 1024 * 1024,       // 1 MB
    PRO: 10 * 1024 * 1024,       // 10 MB
    ENTERPRISE: 50 * 1024 * 1024 // 50 MB
  };

  public isPayloadAllowed(tier: string, byteLength: number): { allowed: boolean; maxAllowed: number } {
    const maxAllowed = this.tierLimits[tier.toUpperCase()] ?? this.tierLimits.FREE;
    return {
      allowed: byteLength <= maxAllowed,
      maxAllowed
    };
  }
}
