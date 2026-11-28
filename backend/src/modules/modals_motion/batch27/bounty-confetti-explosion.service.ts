export class BountyConfettiExplosion {
  generateParticleBatch(particleCount = 50, origin = { x: 0.5, y: 0.6 }) {
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.2);
      const velocity = 8 + Math.random() * 12;
      particles.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 4, // initial upward lift
        color: colors[i % colors.length],
        size: 4 + Math.floor(Math.random() * 4),
        lifespanMs: 1500 + Math.floor(Math.random() * 1000)
      });
    }
    return particles;
  }
}
