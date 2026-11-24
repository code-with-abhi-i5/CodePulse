import { Injectable, Logger } from '@nestjs/common';

export interface FlameNode {
  name: string;
  value: number;
  children: FlameNode[];
}

@Injectable()
export class FlamegraphGeneratorService {
  private readonly logger = new Logger(FlamegraphGeneratorService.name);

  /**
   * Converts folded stack strings into a hierarchical Flame Graph JSON tree.
   * Example folded stack: 'main;processRequest;evalCode 42'
   */
  public buildFlameTree(foldedStacks: string[]): FlameNode {
    const root: FlameNode = {
      name: 'root',
      value: 0,
      children: [],
    };

    for (const line of foldedStacks) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const lastSpace = trimmed.lastIndexOf(' ');
      if (lastSpace === -1) continue;

      const stackPath = trimmed.substring(0, lastSpace).split(';');
      const samples = parseInt(trimmed.substring(lastSpace + 1), 10);
      if (isNaN(samples) || samples <= 0) continue;

      root.value += samples;
      let currentNode = root;

      for (const frame of stackPath) {
        let child = currentNode.children.find((c) => c.name === frame);
        if (!child) {
          child = {
            name: frame,
            value: 0,
            children: [],
          };
          currentNode.children.push(child);
        }
        child.value += samples;
        currentNode = child;
      }
    }

    return root;
  }

  /**
   * Generates a lightweight interactive SVG flame graph representation from a flame tree.
   */
  public renderSvg(tree: FlameNode, width = 1200, rowHeight = 18): string {
    const depth = this.calculateDepth(tree);
    const height = (depth + 1) * rowHeight + 40;

    let svg = `<svg version="1.1" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: monospace; font-size: 11px;">\n`;
    svg += `<rect width="100%" height="100%" fill="#1a1a1a"/>\n`;
    svg += `<text x="10" y="20" fill="#ffffff" font-size="14" font-weight="bold">eBPF CPU Flame Graph (Total Samples: ${tree.value})</text>\n`;

    const renderNode = (node: FlameNode, x: number, y: number, nodeWidth: number, level: number) => {
      if (nodeWidth < 1) return; // omit sub-pixel blocks

      // Generate warm flame colors (red/orange/yellow) deterministically
      const hue = Math.floor(Math.abs(this.hashCode(node.name)) % 60); // 0 to 60 (red to yellow)
      const fill = `hsl(${hue}, 85%, 55%)`;

      svg += `<g class="func" transform="translate(${x.toFixed(1)}, ${y})">\n`;
      svg += `  <rect width="${nodeWidth.toFixed(1)}" height="${rowHeight - 1}" fill="${fill}" stroke="#222" rx="2">\n`;
      svg += `    <title>${node.name} (${node.value} samples, ${((node.value / tree.value) * 100).toFixed(1)}%)</title>\n`;
      svg += `  </rect>\n`;

      if (nodeWidth > 35) {
        const truncated = node.name.length > nodeWidth / 7 ? node.name.substring(0, Math.floor(nodeWidth / 7)) + '..' : node.name;
        svg += `  <text x="3" y="${rowHeight - 5}" fill="#000000" font-weight="600">${this.escapeXml(truncated)}</text>\n`;
      }
      svg += `</g>\n`;

      let currentX = x;
      for (const child of node.children) {
        const childWidth = (child.value / node.value) * nodeWidth;
        renderNode(child, currentX, y - rowHeight, childWidth, level + 1);
        currentX += childWidth;
      }
    };

    // Render from bottom up
    const baseY = height - 25;
    renderNode(tree, 10, baseY, width - 20, 0);

    svg += `</svg>`;
    return svg;
  }

  private calculateDepth(node: FlameNode): number {
    if (!node.children || node.children.length === 0) return 1;
    let maxChildDepth = 0;
    for (const child of node.children) {
      maxChildDepth = Math.max(maxChildDepth, this.calculateDepth(child));
    }
    return 1 + maxChildDepth;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
