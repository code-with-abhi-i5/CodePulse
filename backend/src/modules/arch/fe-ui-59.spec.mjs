import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoAstBreadcrumbsService } from './fe-ui-59.service.ts';

describe('MonacoAstBreadcrumbsService (FE-UI-59)', () => {
  it('resolves hierarchical AST scope chain for line number', () => {
    const scopes = [
      {
        id: 'cls-1',
        name: 'BattleManager',
        kind: 'class',
        startLine: 1,
        endLine: 50,
        children: [
          {
            id: 'fn-1',
            name: 'submitCode',
            kind: 'function',
            startLine: 10,
            endLine: 30
          }
        ]
      }
    ];

    const breadcrumbs = new MonacoAstBreadcrumbsService(scopes);
    const chain = breadcrumbs.getBreadcrumbChain(15);
    assert.strictEqual(chain.length, 2);
    assert.strictEqual(chain[0].name, 'BattleManager');
    assert.strictEqual(chain[1].name, 'submitCode');

    assert.strictEqual(breadcrumbs.formatBreadcrumbString(15), 'BattleManager > submitCode');
  });

  it('returns global when line is outside defined scopes', () => {
    const breadcrumbs = new MonacoAstBreadcrumbsService([]);
    assert.strictEqual(breadcrumbs.formatBreadcrumbString(99), 'global');
  });
});
