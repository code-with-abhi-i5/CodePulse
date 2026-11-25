/**
 * Architecture Service: Canvas Telemetry Chart Visualizer
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-10]
 */

export interface DataPoint {
  timestamp: number;
  value: number;
}

export class CanvasTelemetryChartVisualizerService {
  private width: number;
  private height: number;

  constructor(width: number = 800, height: number = 400) {
    this.width = width;
    this.height = height;
  }

  public scalePoints(points: DataPoint[]): Array<{ x: number; y: number }> {
    if (points.length === 0) return [];
    if (points.length === 1) return [{ x: 0, y: this.height / 2 }];

    const minX = points[0].timestamp;
    const maxX = points[points.length - 1].timestamp;
    const values = points.map(p => p.value);
    const minY = Math.min(...values);
    const maxY = Math.max(...values);
    const yRange = maxY - minY || 1;
    const xRange = maxX - minX || 1;

    return points.map(p => ({
      x: Math.round(((p.timestamp - minX) / xRange) * this.width),
      y: Math.round(this.height - ((p.value - minY) / yRange) * this.height)
    }));
  }

  public downsample(points: DataPoint[], maxPoints: number = 100): DataPoint[] {
    if (points.length <= maxPoints) return points;
    const step = Math.ceil(points.length / maxPoints);
    const sampled: DataPoint[] = [];
    for (let i = 0; i < points.length; i += step) {
      sampled.push(points[i]);
    }
    return sampled;
  }
}
