import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoCodeTourService } from './fe-ui-49.service.ts';

describe('MonacoCodeTourService (FE-UI-49)', () => {
  it('steps through guided tour items sequentially', () => {
    const steps = [
      { id: 's1', stepNumber: 1, title: 'Imports', description: 'Module imports', filePath: 'app.ts', startLine: 1, endLine: 5 },
      { id: 's2', stepNumber: 2, title: 'Handler', description: 'Express handler', filePath: 'app.ts', startLine: 10, endLine: 20 }
    ];
    const tour = new MonacoCodeTourService(steps);

    assert.strictEqual(tour.getCurrentStep()?.id, 's1');
    assert.strictEqual(tour.getProgress().percentage, 50);

    const next = tour.nextStep();
    assert.strictEqual(next?.id, 's2');
    assert.strictEqual(tour.getProgress().percentage, 100);

    assert.strictEqual(tour.nextStep(), null);
    assert.strictEqual(tour.previousStep()?.id, 's1');
  });

  it('jumps to valid indices within bounds', () => {
    const tour = new MonacoCodeTourService([
      { id: 's1', stepNumber: 1, title: '1', description: '', filePath: 'a.ts', startLine: 1, endLine: 2 },
      { id: 's2', stepNumber: 2, title: '2', description: '', filePath: 'a.ts', startLine: 3, endLine: 4 }
    ]);
    assert.strictEqual(tour.jumpToStep(1), true);
    assert.strictEqual(tour.getCurrentStep()?.id, 's2');
    assert.strictEqual(tour.jumpToStep(10), false);
  });
});
