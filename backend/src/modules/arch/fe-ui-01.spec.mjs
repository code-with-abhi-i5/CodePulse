import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoVirtualizedLineRendererService } from './fe-ui-01.service.ts';

describe('MonacoVirtualizedLineRendererService (FE-UI-01)', () => {
  it('calculates virtualized line ranges and top offset with overscan padding', () => {
    const renderer = new MonacoVirtualizedLineRendererService({
      lineHeight: 20,
      viewportHeight: 600, // 30 lines visible
      overscanCount: 5
    });

    // Scrolled 2000px down = line index 100
    const range = renderer.calculateVisibleRange(2000, 100000);
    assert.strictEqual(range.startLine, 96); // 100 - 5 + 1
    assert.strictEqual(range.endLine, 135);  // 100 + 30 + 5
    assert.strictEqual(range.renderedLineCount, 40);
    assert.strictEqual(range.topOffsetPx, 95 * 20);
  });

  it('slices large buffers with zero memory footprint for off-screen lines', () => {
    const renderer = new MonacoVirtualizedLineRendererService({ lineHeight: 20, viewportHeight: 100, overscanCount: 2 });
    const buffer = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`);
    const range = renderer.calculateVisibleRange(0, 50);

    const sliced = renderer.sliceBuffer(buffer, range);
    assert.strictEqual(sliced[0], 'line 1');
    assert.ok(sliced.length < 15);
  });
});
