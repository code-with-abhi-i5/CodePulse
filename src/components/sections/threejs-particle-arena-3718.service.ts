export interface Particle { id: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; }
export class ThreeJsParticleArenaService_3718 {
  private pool: Particle[] = [];
  private maxParticles: number;
  constructor(maxParticles: number = 1000) { this.maxParticles = maxParticles; }
  public emitBurst(count = 50): Particle[] {
    const burst: Particle[] = [];
    for (let i = 0; i < Math.min(count, this.maxParticles); i++) {
      burst.push({ id: i, x: 0, y: 0, z: 0, vx: Math.random() - 0.5, vy: Math.random() * 2, vz: Math.random() - 0.5, life: 1.0 });
    }
    this.pool.push(...burst);
    return burst;
  }
  public update(delta: number): number {
    this.pool = this.pool.filter(p => { p.life -= delta; p.x += p.vx; p.y += p.vy; return p.life > 0; });
    return this.pool.length;
  }
}