/**
 * Architecture Service: WebGL 3D Battle Arena LOD Optimizer
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-02]
 */

export const LodTier = {
  HIGH: 'HIGH',         // Detailed mesh (>5000 triangles)
  MEDIUM: 'MEDIUM',     // Decimated mesh (1500 triangles)
  LOW: 'LOW',           // Low-poly (300 triangles)
  BILLBOARD: 'BILLBOARD'// 2D sprite imposter (2 triangles)
} as const;

export type LodTier = typeof LodTier[keyof typeof LodTier];

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export class WebGlBattleArenaLodOptimizerService {
  private highThreshold: number;
  private mediumThreshold: number;
  private lowThreshold: number;

  constructor(highThreshold: number = 25, mediumThreshold: number = 75, lowThreshold: number = 200) {
    this.highThreshold = highThreshold;
    this.mediumThreshold = mediumThreshold;
    this.lowThreshold = lowThreshold;
  }

  public calculateDistance(p1: Vector3D, p2: Vector3D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public resolveLodTier(cameraPos: Vector3D, entityPos: Vector3D): LodTier {
    const dist = this.calculateDistance(cameraPos, entityPos);
    if (dist <= this.highThreshold) return LodTier.HIGH;
    if (dist <= this.mediumThreshold) return LodTier.MEDIUM;
    if (dist <= this.lowThreshold) return LodTier.LOW;
    return LodTier.BILLBOARD;
  }
}
