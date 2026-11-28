export class StaggeredCoverageVerifier {
  verifyMonotonicDelay(delays: number[]): boolean {
    if (delays.length <= 1) return true;
    for (let i = 1; i < delays.length; i++) {
      if (delays[i] < delays[i - 1]) return false;
    }
    return true;
  }
}
