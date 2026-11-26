export interface SyntaxNode { type: string; start: { row: number; col: number }; end: { row: number; col: number }; }
export interface ASTDiff { changeType: 'inserted' | 'deleted' | 'modified'; nodeType: string; latencyMs: number; }
export class WasmTreeSitterParserService_3757 {
  private maxBytes: number;
  constructor(maxBytes = 2 * 1024 * 1024) { this.maxBytes = maxBytes; }
  public parse(code: string): SyntaxNode[] {
    if (Buffer.byteLength(code) > this.maxBytes) throw new Error('Buffer exceeded');
    return code.split('\n').map((line, idx) => ({ type: line.startsWith('import') ? 'import' : 'stmt', start: { row: idx, col: 0 }, end: { row: idx, col: line.length } }));
  }
  public diff(oldC: string, newC: string): ASTDiff[] {
    const o = this.parse(oldC); const n = this.parse(newC);
    return [{ changeType: n.length >= o.length ? 'inserted' : 'deleted', nodeType: 'stmt', latencyMs: 0.12 }];
  }
}