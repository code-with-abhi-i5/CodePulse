import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CanvasTelemetryChartVisualizerService } from './fe-ui-10.service.ts';

describe('CanvasTelemetryChartVisualizerService (FE-UI-10)', () => {
  it('scales time-series data points to canvas coordinate bounds and downsamples dense points', () => {
    const visualizer = new CanvasTelemetryChartVisualizerService(800, 400);
    const raw = [
      { timestamp: 1000, value: 0 },
      { timestamp: 2000, value: 50 },
      { timestamp: 3000, value: 100 }
    ];

    const scaled = visualizer.scalePoints(raw);
    assert.strictEqual(scaled[0].x, 0);
    assert.strictEqual(scaled[0].y, 400); // minY is bottom of canvas
    assert.strictEqual(scaled[2].x, 800);
    assert.strictEqual(scaled[2].y, 0);   // maxY is top of canvas

    // Downsampling
    const dense = Array.from({ length: 500 }, (_, i) => ({ timestamp: i, value: i }));
    const downsampled = visualizer.downsample(dense, 50);
    assert.ok(downsampled.length <= 50);
  });
});
