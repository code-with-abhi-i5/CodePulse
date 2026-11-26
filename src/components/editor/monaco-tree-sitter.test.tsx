import { describe, it, expect } from 'vitest';
import {
  BrowserPersistentWasmCache,
  detectLanguageFromFilename,
  SUPPORTED_TREE_SITTER_LANGUAGES,
  TreeSitterWasmEngine,
} from './tree-sitter-wasm';
import { bindParseResultToMonaco } from './monaco-tree-sitter';

describe('Tree-sitter WebAssembly Parser & Monaco Bridge (20+ Languages, Incremental AST & Error Markers)', () => {
  it('supports 20+ programming languages and lazily loads/caches grammar Wasm modules on demand', async () => {
    expect(SUPPORTED_TREE_SITTER_LANGUAGES.length).toBeGreaterThanOrEqual(20);
    expect(detectLanguageFromFilename('solver.py').id).toBe('python');
    expect(detectLanguageFromFilename('engine.rs').id).toBe('rust');
    expect(detectLanguageFromFilename('service.go').id).toBe('go');
    expect(detectLanguageFromFilename('compiler.cpp').id).toBe('cpp');

    const cache = new BrowserPersistentWasmCache();
    const engine = new TreeSitterWasmEngine('/wasm/tree-sitter.wasm', cache);

    expect(engine.isLanguageLoaded('rust')).toBe(false);
    await engine.loadLanguageGrammar('rust');
    expect(engine.isLanguageLoaded('rust')).toBe(true);

    const cachedBytes = await cache.get('/wasm/tree-sitter-rust.wasm');
    expect(cachedBytes).not.toBeNull();
  });

  it('performs incremental parsing under 3ms and extracts client-side syntax error nodes & Monaco markers', async () => {
    const engine = new TreeSitterWasmEngine();
    const uri = 'file:///workspace/solution.ts';

    const validCode = [
      'export class GraphSolver {',
      '  function shortestPath(nodes: number) {',
      '    return nodes;',
      '  }',
      '}',
    ].join('\n');

    const res1 = await engine.parseIncremental({
      uri,
      languageId: 'typescript',
      newSource: validCode,
    });
    expect(res1.parseTimeMs).toBeLessThan(3);
    expect(res1.errors).toHaveLength(0);

    const monacoValid = bindParseResultToMonaco(validCode, res1, 2);
    expect(monacoValid.breadcrumbs).toContain('shortestPath');
    expect(monacoValid.markers).toHaveLength(0);

    // Introduce syntax error (unclosed brace / invalid token)
    const brokenCode = [
      'export class GraphSolver {',
      '  function shortestPath(nodes: number) {',
      '    return @@SYNTAX_ERROR@@;',
      '  function helper() { return 1; }',
    ].join('\n');

    const res2 = await engine.parseIncremental({
      uri,
      languageId: 'typescript',
      newSource: brokenCode,
      edit: { startIndex: 60, oldEndIndex: 72, newEndIndex: 95 },
    });
    expect(res2.parseTimeMs).toBeLessThan(3);
    expect(res2.errors.length).toBeGreaterThan(0);

    const monacoBroken = bindParseResultToMonaco(brokenCode, res2, 2);
    expect(monacoBroken.markers.length).toBeGreaterThan(0);
    expect(monacoBroken.markers[0].source).toBe('tree-sitter-wasm');
  });
});
