/**
 * Architecture Service: Virtualized Terminal Emulator
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-36]
 */

export interface LogLine {
  id: number;
  raw: string;
  tokens: { text: string; color?: string; bold?: boolean }[];
  timestamp: number;
}

export interface VirtualWindow {
  startIndex: number;
  endIndex: number;
  topPadding: number;
  bottomPadding: number;
  visibleLines: LogLine[];
}

export class VirtualizedTerminalEmulatorService {
  private maxCapacity: number;
  private lineHeight: number;
  private lines: LogLine[];
  private nextId: number;

  constructor(maxCapacity: number = 10000, lineHeight: number = 20) {
    this.maxCapacity = maxCapacity;
    this.lineHeight = lineHeight;
    this.lines = [];
    this.nextId = 1;
  }

  public parseAnsi(text: string): { text: string; color?: string; bold?: boolean }[] {
    const tokens: { text: string; color?: string; bold?: boolean }[] = [];
    const ansiRegex = /\x1b\[([0-9;]*)m/g;
    let lastIndex = 0;
    let currentColor: string | undefined = undefined;
    let isBold = false;
    let match: RegExpExecArray | null;

    while ((match = ansiRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          text: text.slice(lastIndex, match.index),
          color: currentColor,
          bold: isBold
        });
      }
      const code = match[1];
      if (code === '0' || code === '') {
        currentColor = undefined;
        isBold = false;
      } else if (code === '1') {
        isBold = true;
      } else if (code === '31') {
        currentColor = '#ef4444'; // Red
      } else if (code === '32') {
        currentColor = '#22c55e'; // Green
      } else if (code === '33') {
        currentColor = '#eab308'; // Yellow
      } else if (code === '34') {
        currentColor = '#3b82f6'; // Blue
      }
      lastIndex = ansiRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      tokens.push({
        text: text.slice(lastIndex),
        color: currentColor,
        bold: isBold
      });
    }

    return tokens.length > 0 ? tokens : [{ text, color: undefined, bold: false }];
  }

  public appendLog(rawText: string): LogLine {
    const line: LogLine = {
      id: this.nextId++,
      raw: rawText,
      tokens: this.parseAnsi(rawText),
      timestamp: Date.now()
    };
    this.lines.push(line);
    if (this.lines.length > this.maxCapacity) {
      this.lines.splice(0, this.lines.length - this.maxCapacity);
    }
    return line;
  }

  public appendBatch(rawLines: string[]): void {
    for (const l of rawLines) {
      this.appendLog(l);
    }
  }

  public computeVirtualWindow(scrollTop: number, viewportHeight: number, overscan: number = 5): VirtualWindow {
    const totalLines = this.lines.length;
    if (totalLines === 0) {
      return { startIndex: 0, endIndex: 0, topPadding: 0, bottomPadding: 0, visibleLines: [] };
    }

    const start = Math.max(0, Math.floor(scrollTop / this.lineHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / this.lineHeight);
    const end = Math.min(totalLines, start + visibleCount + overscan * 2);

    return {
      startIndex: start,
      endIndex: end,
      topPadding: start * this.lineHeight,
      bottomPadding: Math.max(0, (totalLines - end) * this.lineHeight),
      visibleLines: this.lines.slice(start, end)
    };
  }

  public searchLogs(query: string): LogLine[] {
    const lower = query.toLowerCase();
    return this.lines.filter(l => l.raw.toLowerCase().includes(lower));
  }

  public clear(): void {
    this.lines = [];
  }

  public getLineCount(): number {
    return this.lines.length;
  }
}
