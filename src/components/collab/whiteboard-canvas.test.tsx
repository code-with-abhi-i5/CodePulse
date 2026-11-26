import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  clampZoom,
  decodeStrokeBinaryDelta,
  encodeStrokeBinaryDelta,
  exportDiagramToMermaid,
  interpolateStrokePoints,
  screenToWorld,
} from "./tools/shape-drawer";
import { DEFAULT_WHITEBOARD_ELEMENTS, WhiteboardCanvas } from "./whiteboard-canvas";

describe("WhiteboardCanvas & ShapeDrawer (Coordinate Transforms, Binary Delta, Interpolation & Mermaid Export)", () => {
  it("clamps zoom to 10%..500%, transforms screen-to-world coordinates with grid snap, interpolates strokes, and round-trips binary deltas", () => {
    expect(clampZoom(0.02)).toBe(0.1);
    expect(clampZoom(9.5)).toBe(5.0);

    const worldPt = screenToWorld({ x: 105, y: 192 }, { panX: 5, panY: 0, zoom: 2.0 }, 20, true);
    expect(worldPt).toEqual({ x: 60, y: 100 });

    const interpolated = interpolateStrokePoints([
      { x: 0, y: 0 },
      { x: 100, y: 50 },
    ]);
    expect(interpolated.length).toBeGreaterThan(2);

    const deltaBuf = encodeStrokeBinaryDelta(interpolated);
    expect(deltaBuf.byteLength).toBeGreaterThan(0);
    const decoded = decodeStrokeBinaryDelta(deltaBuf);
    expect(decoded).toHaveLength(interpolated.length);
    expect(decoded[decoded.length - 1]).toEqual({
      x: Math.round(interpolated[interpolated.length - 1].x),
      y: Math.round(interpolated[interpolated.length - 1].y),
    });
  });

  it("renders architectural shapes, colored teammate laser pointers, zoom/pan controls, and Mermaid.js export", () => {
    render(<WhiteboardCanvas initialElements={DEFAULT_WHITEBOARD_ELEMENTS} />);

    expect(screen.getByTestId("laser-cursor-p-1")).toBeTruthy();
    expect(screen.getByTestId("laser-cursor-p-2")).toBeTruthy();

    fireEvent.click(screen.getByTestId("whiteboard-zoom-in"));
    expect(screen.getByTestId("whiteboard-zoom-readout").textContent).toBe("125%");

    fireEvent.click(screen.getByTestId("whiteboard-pan-right"));
    expect(screen.getByTestId("whiteboard-pan-readout").getAttribute("data-pan")).toBe("40,0");

    fireEvent.click(screen.getByTestId("export-mermaid-btn"));
    const mermaidOut = screen.getByTestId("whiteboard-export-output");
    expect(mermaidOut.getAttribute("data-export-format")).toBe("MERMAID");
    expect(mermaidOut.textContent).toContain("flowchart LR");
    expect(mermaidOut.textContent).toContain("API Gateway");

    const directMermaid = exportDiagramToMermaid(DEFAULT_WHITEBOARD_ELEMENTS);
    expect(directMermaid).toContain("Postgres Primary");
  });
});
