export type ArchitectureShapeKind =
  | 'SERVICE_RECTANGLE'
  | 'DATABASE_CYLINDER'
  | 'MESSAGE_QUEUE_PIPE'
  | 'DIRECTED_ARROW';

export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardElement {
  id: string;
  kind: ArchitectureShapeKind;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fromId?: string;
  toId?: string;
  strokePoints?: WhiteboardPoint[];
  color?: string;
}

export interface ViewportTransform {
  panX: number;
  panY: number;
  zoom: number; // 0.1 (10%) to 5.0 (500%)
}

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1;
  return Math.max(0.1, Math.min(5.0, Number(zoom.toFixed(2))));
}

export function snapToGrid(value: number, gridSize = 20): number {
  if (gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

export function screenToWorld(
  screenPt: WhiteboardPoint,
  viewport: ViewportTransform,
  gridSize = 20,
  snap = true,
): WhiteboardPoint {
  const z = clampZoom(viewport.zoom);
  const rawX = (screenPt.x - viewport.panX) / z;
  const rawY = (screenPt.y - viewport.panY) / z;
  return {
    x: snap ? snapToGrid(rawX, gridSize) : Number(rawX.toFixed(2)),
    y: snap ? snapToGrid(rawY, gridSize) : Number(rawY.toFixed(2)),
  };
}

export function worldToScreen(
  worldPt: WhiteboardPoint,
  viewport: ViewportTransform,
): WhiteboardPoint {
  const z = clampZoom(viewport.zoom);
  return {
    x: Number((worldPt.x * z + viewport.panX).toFixed(2)),
    y: Number((worldPt.y * z + viewport.panY).toFixed(2)),
  };
}

/**
 * Linearly interpolates dense stroke points between waypoints for smooth vector curves.
 */
export function interpolateStrokePoints(
  points: WhiteboardPoint[],
  stepsPerSegment = 4,
): WhiteboardPoint[] {
  if (points.length <= 1) return [...points];
  const steps = Math.max(1, stepsPerSegment);
  const out: WhiteboardPoint[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push({
        x: Number((a.x + (b.x - a.x) * t).toFixed(2)),
        y: Number((a.y + (b.y - a.y) * t).toFixed(2)),
      });
    }
  }
  out.push({ ...points[points.length - 1] });
  return out;
}

/**
 * Compresses vector stroke points into a compact binary Int16Array coordinate buffer
 * (delta-encoded relative to initial point for fast WebSocket transmission).
 */
export function encodeStrokeBinaryDelta(points: WhiteboardPoint[]): ArrayBuffer {
  if (points.length === 0) {
    return new ArrayBuffer(0);
  }
  const int16 = new Int16Array(points.length * 2);
  let prevX = Math.round(points[0].x);
  let prevY = Math.round(points[0].y);
  int16[0] = prevX;
  int16[1] = prevY;

  for (let i = 1; i < points.length; i++) {
    const curX = Math.round(points[i].x);
    const curY = Math.round(points[i].y);
    int16[i * 2] = curX - prevX;
    int16[i * 2 + 1] = curY - prevY;
    prevX = curX;
    prevY = curY;
  }

  return int16.buffer.slice(0);
}

/**
 * Decodes a binary Int16Array delta buffer back into absolute WhiteboardPoints.
 */
export function decodeStrokeBinaryDelta(buffer: ArrayBuffer): WhiteboardPoint[] {
  if (!buffer || buffer.byteLength < 4) return [];
  const int16 = new Int16Array(buffer);
  const points: WhiteboardPoint[] = [];
  let curX = int16[0];
  let curY = int16[1];
  points.push({ x: curX, y: curY });

  for (let i = 2; i + 1 < int16.length; i += 2) {
    curX += int16[i];
    curY += int16[i + 1];
    points.push({ x: curX, y: curY });
  }
  return points;
}

/**
 * Renders an SVG representation for a single architectural element.
 */
export function renderElementSvgMarkup(el: WhiteboardElement): string {
  const safeLabel = el.label.replace(/[<>&"]/g, '');
  const stroke = el.color ?? '#38BDF8';

  if (el.kind === 'DATABASE_CYLINDER') {
    const ry = Math.max(8, Math.min(18, el.height * 0.18));
    return `<g data-shape="DATABASE_CYLINDER"><ellipse cx="${el.x + el.width / 2}" cy="${el.y + ry}" rx="${el.width / 2}" ry="${ry}" fill="#0F172A" stroke="${stroke}" stroke-width="2"/><rect x="${el.x}" y="${el.y + ry}" width="${el.width}" height="${Math.max(10, el.height - ry)}" fill="#0F172A" stroke="${stroke}" stroke-width="2"/><text x="${el.x + el.width / 2}" y="${el.y + el.height / 2 + 6}" text-anchor="middle" fill="#F8FAFC" font-size="12">${safeLabel}</text></g>`;
  }

  if (el.kind === 'MESSAGE_QUEUE_PIPE') {
    return `<g data-shape="MESSAGE_QUEUE_PIPE"><rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${el.height / 2}" fill="#1E1B4B" stroke="#A78BFA" stroke-width="2" stroke-dasharray="6 3"/><text x="${el.x + el.width / 2}" y="${el.y + el.height / 2 + 4}" text-anchor="middle" fill="#EDE9FE" font-size="11">${safeLabel}</text></g>`;
  }

  if (el.kind === 'DIRECTED_ARROW') {
    const x2 = el.x + el.width;
    const y2 = el.y + el.height;
    return `<g data-shape="DIRECTED_ARROW"><line x1="${el.x}" y1="${el.y}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2.5"/><polygon points="${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 4},${y2 + 8}" fill="${stroke}"/></g>`;
  }

  return `<g data-shape="SERVICE_RECTANGLE"><rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="8" fill="#18181B" stroke="${stroke}" stroke-width="2"/><text x="${el.x + el.width / 2}" y="${el.y + el.height / 2 + 4}" text-anchor="middle" fill="#F4F4F5" font-size="12">${safeLabel}</text></g>`;
}

/**
 * Generates valid Mermaid.js architecture flowchart syntax from canvas elements.
 */
export function exportDiagramToMermaid(elements: WhiteboardElement[]): string {
  const lines: string[] = ['flowchart LR'];
  const nodeIds = new Map<string, string>();

  elements.forEach((el, index) => {
    const safeId = `N${index}_${el.id.replace(/[^a-zA-Z0-9_]/g, '')}`;
    const cleanLabel = el.label.replace(/"/g, "'") || el.kind;
    nodeIds.set(el.id, safeId);

    if (el.kind === 'DATABASE_CYLINDER') {
      lines.push(`  ${safeId}[("${cleanLabel}")]`);
    } else if (el.kind === 'MESSAGE_QUEUE_PIPE') {
      lines.push(`  ${safeId}[["${cleanLabel}"]]`);
    } else if (el.kind === 'DIRECTED_ARROW') {
      const src = el.fromId && nodeIds.get(el.fromId) ? nodeIds.get(el.fromId)! : 'Client';
      const dst = el.toId && nodeIds.get(el.toId) ? nodeIds.get(el.toId)! : 'Service';
      if (src === 'Client') lines.push(`  Client["Client"]`);
      if (dst === 'Service') lines.push(`  Service["Service"]`);
      lines.push(`  ${src} -->|"${cleanLabel}"| ${dst}`);
    } else {
      lines.push(`  ${safeId}["${cleanLabel}"]`);
    }
  });

  return lines.join('\n');
}

export function exportDiagramToSvg(elements: WhiteboardElement[]): string {
  const body = elements.map(renderElementSvgMarkup).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" width="1200" height="720">\n  ${body}\n</svg>`;
}

export function exportDiagramToPngDataUrl(elements: WhiteboardElement[]): string {
  const svgStr = exportDiagramToSvg(elements);
  const encoded = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(svgStr))) : '';
  return `data:image/png;base64,${encoded}`;
}
