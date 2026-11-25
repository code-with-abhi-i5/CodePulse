/**
 * Architecture Service: Collaborative Cursor Interpolator
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-15]
 */

export interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

export class CollaborativeCursorInterpolatorService {
  private lastPosition: CursorPosition | null;
  private targetPosition: CursorPosition | null;

  constructor() {
    this.lastPosition = null;
    this.targetPosition = null;
  }

  public updateTarget(pos: CursorPosition): void {
    if (!this.lastPosition) {
      this.lastPosition = pos;
    } else if (this.targetPosition) {
      this.lastPosition = this.targetPosition;
    }
    this.targetPosition = pos;
  }

  public interpolate(progress: number): { x: number; y: number } {
    if (!this.lastPosition || !this.targetPosition) {
      return { x: 0, y: 0 };
    }

    const t = Math.max(0, Math.min(1, progress));
    // Smoothstep cubic easing: 3t^2 - 2t^3
    const smoothT = t * t * (3 - 2 * t);

    const x = this.lastPosition.x + (this.targetPosition.x - this.lastPosition.x) * smoothT;
    const y = this.lastPosition.y + (this.targetPosition.y - this.lastPosition.y) * smoothT;

    return { x: Math.round(x), y: Math.round(y) };
  }
}
