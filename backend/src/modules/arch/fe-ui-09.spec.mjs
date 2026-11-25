import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoSemanticHoverProviderService } from './fe-ui-09.service.ts';

describe('MonacoSemanticHoverProviderService (FE-UI-09)', () => {
  it('resolves semantic symbol hover tooltips with signatures and documentation', () => {
    const provider = new MonacoSemanticHoverProviderService();
    provider.registerSymbol({
      symbol: 'calculateDistance',
      signature: 'function calculateDistance(p1: Point, p2: Point): number',
      docstring: 'Calculates the Euclidean distance between two spatial points.'
    });

    const hover = provider.getHoverTooltip('calculateDistance');
    assert.ok(hover);
    assert.ok(hover.contents[0].includes('calculateDistance(p1: Point, p2: Point)'));
    assert.strictEqual(hover.contents[1], 'Calculates the Euclidean distance between two spatial points.');

    assert.strictEqual(provider.getHoverTooltip('unknownSymbol'), null);
  });
});
