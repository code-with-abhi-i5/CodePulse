/**
 * Architecture Service: ClickHouse Mutation Queue Backpressure Monitor
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-53]
 */

export class ClickHouseMutationBackpressureService {
  private maxAllowedPendingMutations: number;

  constructor(maxAllowedPendingMutations: number = 10) {
    this.maxAllowedPendingMutations = maxAllowedPendingMutations;
  }

  public evaluateMutationSubmission(pendingMutationsCount: number): {
    canSubmit: boolean;
    reason?: string;
  } {
    if (pendingMutationsCount >= this.maxAllowedPendingMutations) {
      return {
        canSubmit: false,
        reason: `ClickHouse mutation queue saturated (${pendingMutationsCount}/${this.maxAllowedPendingMutations}). Mutation throttled to prevent server stalls.`
      };
    }

    return { canSubmit: true };
  }
}
