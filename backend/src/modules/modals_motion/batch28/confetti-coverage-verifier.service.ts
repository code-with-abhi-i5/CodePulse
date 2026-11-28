export class ConfettiCoverageVerifier {
  verifyParticleCount(particles: Array<{ vx: number; vy: number }>, expectedCount: number): boolean {
    return particles.length === expectedCount && particles.every(p => !isNaN(p.vx) && !isNaN(p.vy));
  }
}
