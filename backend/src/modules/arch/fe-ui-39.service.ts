/**
 * Architecture Service: Collaborative Whiteboard Canvas Component
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-39]
 */

export interface WhiteboardElement {
  id: string;
  type: 'stroke' | 'rect' | 'circle' | 'arrow' | 'text';
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
  authorId: string;
}

export class CollaborativeWhiteboardService {
  private elements: Map<string, WhiteboardElement>;
  private undoStack: WhiteboardElement[];
  private redoStack: WhiteboardElement[];

  constructor() {
    this.elements = new Map();
    this.undoStack = [];
    this.redoStack = [];
  }

  public addElement(el: WhiteboardElement): void {
    this.elements.set(el.id, el);
    this.undoStack.push(el);
    this.redoStack = [];
  }

  public getElement(id: string): WhiteboardElement | undefined {
    return this.elements.get(id);
  }

  public getAllElements(): WhiteboardElement[] {
    return Array.from(this.elements.values());
  }

  public undo(): WhiteboardElement | null {
    const el = this.undoStack.pop();
    if (!el) return null;
    this.elements.delete(el.id);
    this.redoStack.push(el);
    return el;
  }

  public redo(): WhiteboardElement | null {
    const el = this.redoStack.pop();
    if (!el) return null;
    this.elements.set(el.id, el);
    this.undoStack.push(el);
    return el;
  }

  public exportSvg(): string {
    const svgParts: string[] = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">'];
    for (const el of this.elements.values()) {
      if (el.type === 'rect') {
        svgParts.push(`<rect x="${el.x || 0}" y="${el.y || 0}" width="${el.width || 10}" height="${el.height || 10}" stroke="${el.color}" stroke-width="${el.strokeWidth}" fill="none"/>`);
      } else if (el.type === 'circle') {
        const r = (el.width || 20) / 2;
        svgParts.push(`<circle cx="${(el.x || 0) + r}" cy="${(el.y || 0) + r}" r="${r}" stroke="${el.color}" stroke-width="${el.strokeWidth}" fill="none"/>`);
      }
    }
    svgParts.push('</svg>');
    return svgParts.join('');
  }
}
