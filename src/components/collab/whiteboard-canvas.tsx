"use client";

import React, { useMemo, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Square,
  Database,
  ArrowRight,
  Workflow,
  Download,
  MousePointer2,
} from "lucide-react";
import {
  ArchitectureShapeKind,
  clampZoom,
  decodeStrokeBinaryDelta,
  encodeStrokeBinaryDelta,
  exportDiagramToMermaid,
  exportDiagramToPngDataUrl,
  exportDiagramToSvg,
  interpolateStrokePoints,
  renderElementSvgMarkup,
  screenToWorld,
  WhiteboardElement,
} from "./tools/shape-drawer";

export interface TeammateLaserCursor {
  peerId: string;
  peerName: string;
  x: number;
  y: number;
  color: string;
}

export interface WhiteboardCanvasProps {
  initialElements?: WhiteboardElement[];
  laserCursors?: TeammateLaserCursor[];
  gridSize?: number;
  onVectorDeltaBroadcast?: (deltaBytes: ArrayBuffer, element: WhiteboardElement) => void;
}

export const DEFAULT_WHITEBOARD_ELEMENTS: WhiteboardElement[] = [
  {
    id: "api-gw",
    kind: "SERVICE_RECTANGLE",
    label: "API Gateway",
    x: 120,
    y: 160,
    width: 150,
    height: 64,
    color: "#38BDF8",
  },
  {
    id: "event-bus",
    kind: "MESSAGE_QUEUE_PIPE",
    label: "Kafka / Event Bus",
    x: 340,
    y: 166,
    width: 170,
    height: 52,
    color: "#A78BFA",
  },
  {
    id: "pg-primary",
    kind: "DATABASE_CYLINDER",
    label: "Postgres Primary",
    x: 590,
    y: 150,
    width: 150,
    height: 84,
    color: "#34D399",
  },
  {
    id: "edge-1",
    kind: "DIRECTED_ARROW",
    label: "Publish Event",
    x: 270,
    y: 192,
    width: 70,
    height: 0,
    fromId: "api-gw",
    toId: "event-bus",
    color: "#FBBF24",
  },
];

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  initialElements = DEFAULT_WHITEBOARD_ELEMENTS,
  laserCursors = [
    { peerId: "p-1", peerName: "Sonia", x: 195, y: 190, color: "#38BDF8" },
    { peerId: "p-2", peerName: "Aarav", x: 660, y: 190, color: "#F43F5E" },
  ],
  gridSize = 20,
  onVectorDeltaBroadcast,
}) => {
  const [elements, setElements] = useState<WhiteboardElement[]>(initialElements);
  const [selectedTool, setSelectedTool] = useState<ArchitectureShapeKind>("SERVICE_RECTANGLE");
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [exportedArtifact, setExportedArtifact] = useState<{
    format: "PNG" | "SVG" | "MERMAID";
    content: string;
  } | null>(null);

  const zoomPercent = Math.round(clampZoom(zoom) * 100);

  const visibleElements = useMemo(() => elements, [elements]);

  const handleZoomChange = (nextZoom: number) => {
    setZoom(clampZoom(nextZoom));
  };

  const handleAddShapeAt = (clientX: number, clientY: number) => {
    const worldPt = screenToWorld(
      { x: clientX, y: clientY },
      { panX: pan.x, panY: pan.y, zoom },
      gridSize,
      snapEnabled,
    );

    const rawStroke = interpolateStrokePoints([
      { x: worldPt.x, y: worldPt.y },
      { x: worldPt.x + 80, y: worldPt.y + 40 },
    ]);
    const encodedDelta = encodeStrokeBinaryDelta(rawStroke);
    const decodedStroke = decodeStrokeBinaryDelta(encodedDelta);

    const newEl: WhiteboardElement = {
      id: `el-${elements.length + 1}`,
      kind: selectedTool,
      label: `${selectedTool.replace(/_/g, " ")} #${elements.length + 1}`,
      x: worldPt.x,
      y: worldPt.y,
      width: selectedTool === "DIRECTED_ARROW" ? 110 : 150,
      height: selectedTool === "DIRECTED_ARROW" ? 0 : 68,
      strokePoints: decodedStroke,
      color: "#38BDF8",
    };

    setElements((prev) => [...prev, newEl]);
    onVectorDeltaBroadcast?.(encodedDelta, newEl);
  };

  return (
    <div
      data-testid="whiteboard-canvas-shell"
      data-zoom-percent={zoomPercent}
      data-element-count={visibleElements.length}
      className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100"
    >
      {/* Toolbar: Shape Primitives, Zoom (10%..500%), Pan & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-testid="tool-service-rect"
            onClick={() => setSelectedTool("SERVICE_RECTANGLE")}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-800"
          >
            <Square className="h-3.5 w-3.5 text-sky-400" /> Service
          </button>
          <button
            type="button"
            data-testid="tool-db-cylinder"
            onClick={() => setSelectedTool("DATABASE_CYLINDER")}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-800"
          >
            <Database className="h-3.5 w-3.5 text-emerald-400" /> Database
          </button>
          <button
            type="button"
            data-testid="tool-mq-pipe"
            onClick={() => setSelectedTool("MESSAGE_QUEUE_PIPE")}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-800"
          >
            <Workflow className="h-3.5 w-3.5 text-purple-400" /> Queue Pipe
          </button>
          <button
            type="button"
            data-testid="tool-arrow"
            onClick={() => setSelectedTool("DIRECTED_ARROW")}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold hover:bg-zinc-800"
          >
            <ArrowRight className="h-3.5 w-3.5 text-amber-400" /> Arrow
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span data-testid="whiteboard-zoom-readout" className="font-mono text-xs text-cyan-300">
            {zoomPercent}%
          </span>
          <button
            type="button"
            data-testid="whiteboard-zoom-out"
            onClick={() => handleZoomChange(zoom - 0.25)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 hover:bg-zinc-800"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            data-testid="whiteboard-zoom-in"
            onClick={() => handleZoomChange(zoom + 0.25)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 hover:bg-zinc-800"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            data-testid="whiteboard-pan-right"
            onClick={() => setPan((p) => ({ x: p.x + 40, y: p.y }))}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs hover:bg-zinc-800"
          >
            Pan +X
          </button>
          <button
            type="button"
            data-testid="toggle-grid-snap"
            onClick={() => setSnapEnabled((s) => !s)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs hover:bg-zinc-800"
          >
            Snap: {snapEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Export Controls: PNG, SVG, Mermaid.js */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="export-mermaid-btn"
          onClick={() =>
            setExportedArtifact({
              format: "MERMAID",
              content: exportDiagramToMermaid(visibleElements),
            })
          }
          className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/25"
        >
          <Download className="h-3.5 w-3.5" /> Export Mermaid.js
        </button>
        <button
          type="button"
          data-testid="export-svg-btn"
          onClick={() =>
            setExportedArtifact({
              format: "SVG",
              content: exportDiagramToSvg(visibleElements),
            })
          }
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
        >
          <Download className="h-3.5 w-3.5" /> Export SVG
        </button>
        <button
          type="button"
          data-testid="export-png-btn"
          onClick={() =>
            setExportedArtifact({
              format: "PNG",
              content: exportDiagramToPngDataUrl(visibleElements),
            })
          }
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
        >
          <Download className="h-3.5 w-3.5" /> Export PNG
        </button>
      </div>

      {/* Interactive SVG Whiteboard Viewport + Multi-User Colored Laser Pointers */}
      <div
        data-testid="whiteboard-pan-readout"
        data-pan={`${pan.x},${pan.y}`}
        className="relative h-80 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
      >
        <svg
          data-testid="whiteboard-svg-stage"
          viewBox="0 0 1000 500"
          onClick={(e) => handleAddShapeAt(e.clientX, e.clientY)}
          className="h-full w-full cursor-crosshair"
          dangerouslySetInnerHTML={{
            __html: `<g transform="translate(${pan.x}, ${pan.y}) scale(${zoom})">${visibleElements
              .map(renderElementSvgMarkup)
              .join("")}</g>`,
          }}
        />

        {laserCursors.map((cursor) => (
          <div
            key={cursor.peerId}
            data-testid={`laser-cursor-${cursor.peerId}`}
            style={{ left: `${cursor.x}px`, top: `${cursor.y}px` }}
            className="pointer-events-none absolute flex items-center gap-1"
          >
            <MousePointer2
              style={{ color: cursor.color }}
              className="h-4 w-4 drop-shadow"
            />
            <span
              style={{ backgroundColor: cursor.color }}
              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-zinc-950"
            >
              {cursor.peerName}
            </span>
          </div>
        ))}
      </div>

      {exportedArtifact && (
        <pre
          data-testid="whiteboard-export-output"
          data-export-format={exportedArtifact.format}
          className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 text-xs text-emerald-300"
        >
          {exportedArtifact.content}
        </pre>
      )}
    </div>
  );
};

export default WhiteboardCanvas;
