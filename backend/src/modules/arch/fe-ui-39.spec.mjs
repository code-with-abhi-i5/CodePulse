import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CollaborativeWhiteboardService } from './fe-ui-39.service.ts';

describe('CollaborativeWhiteboardService (FE-UI-39)', () => {
  it('manages whiteboard shapes and undo/redo history', () => {
    const wb = new CollaborativeWhiteboardService();
    wb.addElement({
      id: 'rect-1',
      type: 'rect',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      color: '#3b82f6',
      strokeWidth: 2,
      authorId: 'mentor-01'
    });

    assert.strictEqual(wb.getAllElements().length, 1);
    const undone = wb.undo();
    assert.strictEqual(undone?.id, 'rect-1');
    assert.strictEqual(wb.getAllElements().length, 0);

    const redone = wb.redo();
    assert.strictEqual(redone?.id, 'rect-1');
    assert.strictEqual(wb.getAllElements().length, 1);
  });

  it('exports elements to SVG format', () => {
    const wb = new CollaborativeWhiteboardService();
    wb.addElement({
      id: 'rect-1',
      type: 'rect',
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      color: '#000',
      strokeWidth: 1,
      authorId: 'user-1'
    });
    const svg = wb.exportSvg();
    assert.ok(svg.includes('<rect'));
    assert.ok(svg.includes('</svg>'));
  });
});
