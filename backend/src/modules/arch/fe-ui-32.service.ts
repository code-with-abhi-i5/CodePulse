/**
 * Architecture Service: Dockable Panel Layout Manager
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-32]
 */

export interface PanelConfig {
  id: string;
  title: string;
  dockEdge: 'LEFT' | 'RIGHT' | 'BOTTOM';
  sizePct: number;
  collapsed: boolean;
}

export class DockablePanelLayoutManagerService {
  private panels: Map<string, PanelConfig>;

  constructor(initialPanels: PanelConfig[] = []) {
    this.panels = new Map();
    initialPanels.forEach(p => this.panels.set(p.id, { ...p }));
  }

  public updatePanelDock(panelId: string, edge: 'LEFT' | 'RIGHT' | 'BOTTOM', sizePct: number): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) return false;
    panel.dockEdge = edge;
    panel.sizePct = Math.max(10, Math.min(80, sizePct));
    return true;
  }

  public serializeLayout(): string {
    return JSON.stringify(Array.from(this.panels.values()));
  }

  public deserializeLayout(serialized: string): void {
    const list: PanelConfig[] = JSON.parse(serialized);
    this.panels.clear();
    list.forEach(p => this.panels.set(p.id, { ...p }));
  }

  public getPanel(id: string): PanelConfig | undefined {
    return this.panels.get(id);
  }
}
