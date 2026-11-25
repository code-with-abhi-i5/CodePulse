/**
 * Architecture Service: WebGL Particle Celebration System
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-19]
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
}

export class WebGlParticleCelebrationService {
  private particles: Particle[];
  private gravity: number;

  constructor(particleCount: number = 100, gravity: number = 0.2) {
    this.gravity = gravity;
    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        life: 1.0
      });
    }
  }

  public stepPhysics(dt: number = 1): Float32Array {
    // Pack 4 floats per particle: [x, y, alpha, life]
    const buffer = new Float32Array(this.particles.length * 4);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += this.gravity * dt;
      p.life = Math.max(0, p.life - 0.02 * dt);
      p.alpha = p.life;

      const idx = i * 4;
      buffer[idx] = p.x;
      buffer[idx + 1] = p.y;
      buffer[idx + 2] = p.alpha;
      buffer[idx + 3] = p.life;
    }
    return buffer;
  }

  public getParticleCount(): number {
    return this.particles.length;
  }
}
