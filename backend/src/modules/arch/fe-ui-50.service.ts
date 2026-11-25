/**
 * Architecture Service: Quick Command Palette
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-50]
 */

export interface PaletteCommand {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  keywords?: string[];
}

export class QuickCommandPaletteService {
  private commands: Map<string, PaletteCommand>;
  private recentIds: string[];

  constructor() {
    this.commands = new Map();
    this.recentIds = [];
  }

  public registerCommand(cmd: PaletteCommand): void {
    this.commands.set(cmd.id, cmd);
  }

  public search(query: string): PaletteCommand[] {
    const q = query.trim().toLowerCase();
    if (!q) {
      return this.recentIds
        .map(id => this.commands.get(id))
        .filter((c): c is PaletteCommand => Boolean(c));
    }

    const matches: { cmd: PaletteCommand; score: number }[] = [];
    for (const cmd of this.commands.values()) {
      let score = 0;
      const titleLower = cmd.title.toLowerCase();
      if (titleLower.startsWith(q)) {
        score += 10;
      } else if (titleLower.includes(q)) {
        score += 5;
      }
      if (cmd.keywords?.some(k => k.toLowerCase().includes(q))) {
        score += 3;
      }
      if (score > 0) {
        matches.push({ cmd, score });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.map(m => m.cmd);
  }

  public executeCommand(id: string): boolean {
    if (!this.commands.has(id)) return false;
    this.recentIds = [id, ...this.recentIds.filter(r => r !== id)].slice(0, 5);
    return true;
  }
}
