export interface Tab { id: string; path: string; modified: boolean; active: boolean; }
export class MultiFileTabbedMonacoService_3720 {
  private tabs: Map<string, Tab> = new Map();
  public openTab(path: string): Tab {
    for (const t of this.tabs.values()) t.active = false;
    const tab: Tab = { id: path, path, modified: false, active: true };
    this.tabs.set(path, tab);
    return tab;
  }
  public closeTab(path: string): boolean { return this.tabs.delete(path); }
  public getActive(): Tab | undefined { return Array.from(this.tabs.values()).find(t => t.active); }
}