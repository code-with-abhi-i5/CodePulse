import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AccessibleDataTableService } from './fe-ui-54.service.ts';

describe('AccessibleDataTableService (FE-UI-54)', () => {
  it('cycles sort direction and sorts tabular data accurately', () => {
    const table = new AccessibleDataTableService([
      { id: '1', name: 'Charlie', score: 80 },
      { id: '2', name: 'Alice', score: 95 },
      { id: '3', name: 'Bob', score: 90 }
    ]);

    table.sort('score'); // ascending
    const asc = table.getSortedData();
    assert.strictEqual(asc[0].name, 'Charlie');
    assert.strictEqual(asc[2].name, 'Alice');

    table.sort('score'); // descending
    const desc = table.getSortedData();
    assert.strictEqual(desc[0].name, 'Alice');
    assert.strictEqual(desc[2].name, 'Charlie');
  });

  it('generates accurate ARIA sort attributes and screen-reader announcements', () => {
    const table = new AccessibleDataTableService([
      { id: '1', score: 10 }
    ]);
    table.sort('score');
    assert.strictEqual(table.getAriaSort('score'), 'ascending');
    assert.strictEqual(table.getAriaLiveAnnouncement(), 'Table sorted by score ascending.');
  });
});
