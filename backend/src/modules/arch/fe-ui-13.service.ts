/**
 * Architecture Service: Semantic Git Diff Viewer
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-13]
 */

export interface DiffLine {
  type: 'ADDED' | 'DELETED' | 'UNCHANGED';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export class SemanticGitDiffViewerService {
  public computeLineDiff(oldText: string, newText: string): DiffLine[] {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const result: DiffLine[] = [];

    let i = 0;
    let j = 0;
    let oldNum = 1;
    let newNum = 1;

    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        result.push({
          type: 'UNCHANGED',
          content: oldLines[i],
          oldLineNumber: oldNum++,
          newLineNumber: newNum++
        });
        i++;
        j++;
      } else if (i < oldLines.length && (j >= newLines.length || !newLines.includes(oldLines[i]))) {
        result.push({
          type: 'DELETED',
          content: oldLines[i],
          oldLineNumber: oldNum++
        });
        i++;
      } else if (j < newLines.length) {
        result.push({
          type: 'ADDED',
          content: newLines[j],
          newLineNumber: newNum++
        });
        j++;
      }
    }

    return result;
  }
}
