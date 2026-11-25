/**
 * Architecture Service: Monaco Minimap Decorations
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-46]
 */

export type GitDiffType = 'ADDED' | 'MODIFIED' | 'DELETED';
export type DiagnosticSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface MinimapDecoration {
  id: string;
  line: number;
  color: string;
  tooltip: string;
  type: 'git-diff' | 'diagnostic';
}

export class MonacoMinimapDecorationService {
  private gitDecorations: Map<number, MinimapDecoration>;
  private diagnosticDecorations: Map<number, MinimapDecoration>;

  constructor() {
    this.gitDecorations = new Map();
    this.diagnosticDecorations = new Map();
  }

  public setGitDiffLine(line: number, type: GitDiffType): void {
    const color = type === 'ADDED' ? '#22c55e' : type === 'MODIFIED' ? '#3b82f6' : '#ef4444';
    this.gitDecorations.set(line, {
      id: `git_${line}`,
      line,
      color,
      tooltip: `Git: ${type}`,
      type: 'git-diff'
    });
  }

  public setDiagnosticLine(line: number, severity: DiagnosticSeverity, message: string): void {
    const color = severity === 'ERROR' ? '#dc2626' : severity === 'WARNING' ? '#f59e0b' : '#60a5fa';
    this.diagnosticDecorations.set(line, {
      id: `diag_${line}`,
      line,
      color,
      tooltip: `${severity}: ${message}`,
      type: 'diagnostic'
    });
  }

  public getDecorationsForRange(startLine: number, endLine: number): MinimapDecoration[] {
    const results: MinimapDecoration[] = [];
    for (let l = startLine; l <= endLine; l++) {
      if (this.diagnosticDecorations.has(l)) {
        results.push(this.diagnosticDecorations.get(l)!);
      } else if (this.gitDecorations.has(l)) {
        results.push(this.gitDecorations.get(l)!);
      }
    }
    return results;
  }

  public clear(): void {
    this.gitDecorations.clear();
    this.diagnosticDecorations.clear();
  }
}
