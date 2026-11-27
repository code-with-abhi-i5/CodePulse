export class GranularErrorBoundaryVerifier {
  private failureCount = 0;

  public recordFailure(): void {
    this.failureCount++;
  }

  public reset(): void {
    this.failureCount = 0;
  }

  public getFallbackView(maxAllowed = 3): 'TRY_AGAIN' | 'FATAL_RELOAD' {
    return this.failureCount >= maxAllowed ? 'FATAL_RELOAD' : 'TRY_AGAIN';
  }
}
