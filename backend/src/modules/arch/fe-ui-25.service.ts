/**
 * Architecture Service: Code Snippet Image Exporter
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-25]
 */

export interface ExportOptions {
  padding: number;
  fontSize: number;
  lineHeight: number;
  showWindowControls: boolean;
}

export interface CanvasLayoutSpecification {
  width: number;
  height: number;
  codeOffsetY: number;
  windowControlsOffsetY: number;
}

export class CodeSnippetImageExportService {
  private options: ExportOptions;

  constructor(options: Partial<ExportOptions> = {}) {
    this.options = {
      padding: 40,
      fontSize: 14,
      lineHeight: 22,
      showWindowControls: true,
      ...options
    };
  }

  public calculateLayout(lines: string[]): CanvasLayoutSpecification {
    const { padding, lineHeight, showWindowControls } = this.options;
    const headerHeight = showWindowControls ? 30 : 0;
    const maxLineLength = Math.max(...lines.map(l => l.length), 20);

    const charWidth = 8.5; // Average monospace char width
    const width = Math.round(maxLineLength * charWidth + padding * 2);
    const height = Math.round(lines.length * lineHeight + headerHeight + padding * 2);

    return {
      width,
      height,
      codeOffsetY: padding + headerHeight,
      windowControlsOffsetY: padding
    };
  }
}
