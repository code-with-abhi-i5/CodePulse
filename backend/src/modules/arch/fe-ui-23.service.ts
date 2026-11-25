/**
 * Architecture Service: SVG Tournament Bracket Viewer
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-23]
 */

export interface BracketNode {
  id: string;
  round: number;
  player1: string;
  player2: string;
  winner?: string;
  x: number;
  y: number;
}

export class SvgTournamentBracketViewerService {
  public computeConnectorPath(p1: { x: number; y: number }, p2: { x: number; y: number }): string {
    const midX = (p1.x + p2.x) / 2;
    // Cubic bezier smooth curve connector
    return `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
  }

  public computeTransformMatrix(panX: number, panY: number, zoom: number): string {
    const clampedZoom = Math.max(0.2, Math.min(3.0, zoom));
    return `matrix(${clampedZoom}, 0, 0, ${clampedZoom}, ${panX}, ${panY})`;
  }
}
