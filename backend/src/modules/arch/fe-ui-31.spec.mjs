import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClientErrorBoundaryService } from './fe-ui-31.service.ts';

describe('ClientErrorBoundaryService (FE-UI-31)', () => {
  it('collects user action breadcrumbs and packages diagnostic crash report', () => {
    const service = new ClientErrorBoundaryService(5);
    service.addBreadcrumb('NAVIGATION', 'User navigated to /battles/123');
    service.addBreadcrumb('UI_CLICK', 'Clicked "Submit" button');

    const error = new TypeError('Cannot read properties of undefined');
    const report = service.generateCrashReport(error, 'at BattleArena (battle.tsx:42)');

    assert.strictEqual(report.errorName, 'TypeError');
    assert.strictEqual(report.errorMessage, 'Cannot read properties of undefined');
    assert.strictEqual(report.breadcrumbs.length, 2);
    assert.strictEqual(report.breadcrumbs[1].message, 'Clicked "Submit" button');
  });
});
