export class ReducedMotionVerifier {
  verifySafety(requestedDuration: number, prefersReducedMotion: boolean): boolean {
    if (prefersReducedMotion && requestedDuration > 0) return false;
    return true;
  }
}
