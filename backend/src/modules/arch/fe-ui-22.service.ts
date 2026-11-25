/**
 * Architecture Service: Monaco Indentation Folding Provider
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-22]
 */

export interface FoldingRange {
  startLine: number;
  endLine: number;
}

export class MonacoIndentationFoldingProviderService {
  public computeFoldingRanges(lines: string[]): FoldingRange[] {
    const ranges: FoldingRange[] = [];
    const stack: Array<{ line: number; indent: number }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().length === 0) continue;

      const indent = line.search(/\S/);
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        const top = stack.pop()!;
        if (i - 1 > top.line) {
          ranges.push({ startLine: top.line + 1, endLine: i });
        }
      }
      stack.push({ line: i, indent });
    }

    while (stack.length > 0) {
      const top = stack.pop()!;
      if (lines.length - 1 > top.line) {
        ranges.push({ startLine: top.line + 1, endLine: lines.length });
      }
    }

    return ranges;
  }
}
