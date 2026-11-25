/**
 * Architecture Service: Off-Main-Thread AST Syntax Highlighter
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-03]
 */

export interface HighlightToken {
  type: 'KEYWORD' | 'STRING' | 'NUMBER' | 'COMMENT' | 'IDENTIFIER';
  value: string;
  start: number;
  end: number;
}

export class OffMainThreadSyntaxHighlighterService {
  private keywords: Set<string> = new Set([
    'const', 'let', 'var', 'function', 'class', 'import', 'export', 'return', 'if', 'else', 'async', 'await'
  ]);

  public tokenizeSource(code: string): HighlightToken[] {
    const tokens: HighlightToken[] = [];
    const regex = /(\/\/[^\n]*)|("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')|(\b\d+(?:\.\d+)?\b)|([a-zA-Z_$][a-zA-Z0-9_$]*)/g;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(code)) !== null) {
      const [full, comment, str, num, ident] = match;
      const start = match.index;
      const end = start + full.length;

      if (comment) {
        tokens.push({ type: 'COMMENT', value: full, start, end });
      } else if (str) {
        tokens.push({ type: 'STRING', value: full, start, end });
      } else if (num) {
        tokens.push({ type: 'NUMBER', value: full, start, end });
      } else if (ident) {
        tokens.push({
          type: this.keywords.has(ident) ? 'KEYWORD' : 'IDENTIFIER',
          value: full,
          start,
          end
        });
      }
    }

    return tokens;
  }
}
