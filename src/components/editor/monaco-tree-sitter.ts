import {
  extractAstSymbols,
  extractSyntaxErrorNodes,
  IncrementalParseResult,
  TreeSitterSymbolNode,
  TreeSitterSyntaxErrorNode,
} from './tree-sitter-wasm';

export interface MonacoSemanticToken {
  line: number;
  startColumn: number;
  length: number;
  tokenType: 'keyword' | 'function' | 'class' | 'comment' | 'string' | 'number';
}

export interface MonacoErrorDiagnosticMarker {
  severity: 'error';
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  source: 'tree-sitter-wasm';
}

export interface MonacoTreeSitterBridgeResult {
  breadcrumbs: string[];
  semanticTokens: MonacoSemanticToken[];
  markers: MonacoErrorDiagnosticMarker[];
  symbols: TreeSitterSymbolNode[];
  errors: TreeSitterSyntaxErrorNode[];
  parseTimeMs: number;
}

export function computeScopeBreadcrumbs(
  source: string,
  cursorLine: number,
): string[] {
  const symbols = extractAstSymbols(source);
  const matching = symbols.filter(
    (s) => cursorLine >= s.startLine && cursorLine <= s.endLine,
  );
  if (matching.length === 0) {
    return ['workspace', 'root'];
  }
  const deepest = matching[matching.length - 1];
  return ['workspace', ...deepest.scopePath];
}

export function extractMonacoSemanticTokens(source: string): MonacoSemanticToken[] {
  const tokens: MonacoSemanticToken[] = [];
  const lines = source.split('\n');

  lines.forEach((lineText, idx) => {
    const line = idx + 1;
    const commentIdx = lineText.indexOf('//');
    if (commentIdx >= 0) {
      tokens.push({
        line,
        startColumn: commentIdx + 1,
        length: lineText.length - commentIdx,
        tokenType: 'comment',
      });
    }

    const fnMatch = lineText.match(/\b(?:function|def|fn)\s+([A-Za-z0-9_]+)/);
    if (fnMatch && fnMatch.index !== undefined) {
      const nameOffset = fnMatch[0].indexOf(fnMatch[1]);
      tokens.push({
        line,
        startColumn: fnMatch.index + nameOffset + 1,
        length: fnMatch[1].length,
        tokenType: 'function',
      });
    }

    const clsMatch = lineText.match(/\bclass\s+([A-Za-z0-9_]+)/);
    if (clsMatch && clsMatch.index !== undefined) {
      const nameOffset = clsMatch[0].indexOf(clsMatch[1]);
      tokens.push({
        line,
        startColumn: clsMatch.index + nameOffset + 1,
        length: clsMatch[1].length,
        tokenType: 'class',
      });
    }
  });

  return tokens;
}

export function buildMonacoMarkersFromParse(
  parseResult: IncrementalParseResult,
): MonacoErrorDiagnosticMarker[] {
  return parseResult.errors.map((err) => ({
    severity: 'error',
    startLineNumber: err.line,
    startColumn: err.column,
    endLineNumber: err.line,
    endColumn: Math.max(err.column + 1, err.endColumn),
    message: err.message,
    source: 'tree-sitter-wasm',
  }));
}

export function bindParseResultToMonaco(
  source: string,
  parseResult: IncrementalParseResult,
  cursorLine = 1,
): MonacoTreeSitterBridgeResult {
  const errors =
    parseResult.errors.length > 0 ? parseResult.errors : extractSyntaxErrorNodes(source);
  const markers = buildMonacoMarkersFromParse({ ...parseResult, errors });
  const breadcrumbs = computeScopeBreadcrumbs(source, cursorLine);
  const semanticTokens = extractMonacoSemanticTokens(source);

  return {
    breadcrumbs,
    semanticTokens,
    markers,
    symbols: parseResult.symbols,
    errors,
    parseTimeMs: parseResult.parseTimeMs,
  };
}
