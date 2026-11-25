/**
 * Architecture Service: Distributed Brute-Force Login Protector
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-28]
 */

export class DistributedBruteForceProtectorService {
  private aggregateFailedLogins: Map<string, number>;
  private globalThreshold: number;

  constructor(globalThreshold: number = 20) {
    this.aggregateFailedLogins = new Map();
    this.globalThreshold = globalThreshold;
  }

  public recordFailure(targetIdentifier: string): { isAttacked: boolean; totalFailures: number } {
    const count = (this.aggregateFailedLogins.get(targetIdentifier) || 0) + 1;
    this.aggregateFailedLogins.set(targetIdentifier, count);

    return {
      isAttacked: count >= this.globalThreshold,
      totalFailures: count
    };
  }

  public reset(targetIdentifier: string): void {
    this.aggregateFailedLogins.delete(targetIdentifier);
  }
}
