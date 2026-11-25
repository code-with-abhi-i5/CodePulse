import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SvgTournamentBracketViewerService } from './fe-ui-23.service.ts';

describe('SvgTournamentBracketViewerService (FE-UI-23)', () => {
  it('generates smooth cubic bezier SVG connector paths between tournament matches and computes clamped transform matrices', () => {
    const viewer = new SvgTournamentBracketViewerService();

    const path = viewer.computeConnectorPath({ x: 100, y: 50 }, { x: 300, y: 150 });
    assert.strictEqual(path, 'M 100 50 C 200 50, 200 150, 300 150');

    const matrix = viewer.computeTransformMatrix(50, 100, 1.5);
    assert.strictEqual(matrix, 'matrix(1.5, 0, 0, 1.5, 50, 100)');
  });
});
