/**
 * Architecture Service: Monaco Editor Virtualized Line Renderer
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-01]
 */

export interface VirtualizationConfig {
  lineHeight: number;
  viewportHeight: number;
  overscanCount: number;
}

export interface RenderRange {
  startLine: number;
  endLine: number;
  topOffsetPx: number;
  renderedLineCount: number;
}

export class MonacoVirtualizedLineRendererService {
  private config: VirtualizationConfig;

  constructor(config: VirtualizationConfig = { lineHeight: 20, viewportHeight: 600, overscanCount: 5 }) {
    this.config = config;
  }

  public calculateVisibleRange(scrollTop: number, totalLines: number): RenderRange {
    const { lineHeight, viewportHeight, overscanCount } = this.config;
    if (totalLines <= 0) {
      return { startLine: 0, endLine: 0, topOffsetPx: 0, renderedLineCount: 0 };
    }

    const firstVisibleIndex = Math.floor(scrollTop / lineHeight);
    const visibleCount = Math.ceil(viewportHeight / lineHeight);

    const startLine = Math.max(1, firstVisibleIndex - overscanCount + 1);
    const endLine = Math.min(totalLines, firstVisibleIndex + visibleCount + overscanCount);
    const topOffsetPx = (startLine - 1) * lineHeight;

    return {
      startLine,
      endLine,
      topOffsetPx,
      renderedLineCount: endLine - startLine + 1
    };
  }

  public sliceBuffer(lines: string[], range: RenderRange): string[] {
    if (lines.length === 0 || range.renderedLineCount === 0) return [];
    return lines.slice(range.startLine - 1, range.endLine);
  }
}
