/**
 * Architecture Service: Monaco Snippet Expansion Engine
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-52]
 */

export interface Tabstop {
  index: number;
  placeholder: string;
}

export class MonacoSnippetExpansionEngineService {
  private tabstops: Tabstop[];
  private currentTabstopIndex: number;
  private template: string;

  constructor(template: string = '') {
    this.template = template;
    this.tabstops = [];
    this.currentTabstopIndex = 0;
    if (template) {
      this.parseSnippet(template);
    }
  }

  public parseSnippet(template: string): void {
    this.template = template;
    this.tabstops = [];
    this.currentTabstopIndex = 0;

    const regex = /\$\{?(\d+)(?::([^}]*))?\}?/g;
    let match: RegExpExecArray | null;
    const tabMap = new Map<number, string>();

    while ((match = regex.exec(template)) !== null) {
      const idx = parseInt(match[1], 10);
      const def = match[2] || '';
      if (!tabMap.has(idx)) {
        tabMap.set(idx, def);
      }
    }

    const sortedIndices = Array.from(tabMap.keys()).sort((a, b) => {
      if (a === 0) return 1;
      if (b === 0) return -1;
      return a - b;
    });

    for (const idx of sortedIndices) {
      this.tabstops.push({ index: idx, placeholder: tabMap.get(idx)! });
    }
  }

  public getTabstops(): Tabstop[] {
    return [...this.tabstops];
  }

  public getCurrentTabstop(): Tabstop | null {
    if (this.currentTabstopIndex < this.tabstops.length) {
      return this.tabstops[this.currentTabstopIndex];
    }
    return null;
  }

  public nextTabstop(): Tabstop | null {
    if (this.currentTabstopIndex < this.tabstops.length - 1) {
      this.currentTabstopIndex++;
      return this.tabstops[this.currentTabstopIndex];
    }
    return null;
  }

  public expand(replacements: Record<number, string>): string {
    return this.template.replace(/\$\{?(\d+)(?::([^}]*))?\}?/g, (_, idxStr, def) => {
      const idx = parseInt(idxStr, 10);
      return replacements[idx] !== undefined ? replacements[idx] : (def || '');
    });
  }
}
