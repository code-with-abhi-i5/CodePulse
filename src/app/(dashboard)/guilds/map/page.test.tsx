import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GuildConquestMapPage, DEFAULT_CONQUEST_NODES } from "./page";

describe("GuildConquestMapPage (Interactive SVG Hexagonal Map, Zoom, Pan & Territory Selection)", () => {
  it("renders all 16 hexagonal territory nodes and supports zoom, pan, and node selection", () => {
    render(<GuildConquestMapPage nodes={DEFAULT_CONQUEST_NODES} />);

    expect(DEFAULT_CONQUEST_NODES).toHaveLength(16);
    expect(screen.getByTestId("hex-node-ts-citadel")).toBeTruthy();
    expect(screen.getByTestId("hex-node-rust-frontier")).toBeTruthy();
    expect(screen.getByTestId("hex-node-postgres-bastion")).toBeTruthy();

    fireEvent.click(screen.getByTestId("hex-node-rust-frontier"));
    expect(screen.getByTestId("selected-territory-panel").textContent).toContain("Rust Frontier");
    expect(screen.getByTestId("selected-territory-panel").textContent).toContain("ZeroCopy Guild");

    fireEvent.click(screen.getByTestId("map-zoom-in"));
    expect(screen.getByTestId("hex-map-viewport").getAttribute("data-zoom")).toBe("1.2");

    const svg = screen.getByTestId("hex-conquest-svg");
    fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(svg, { clientX: 145, clientY: 120 });
    fireEvent.mouseUp(svg);
    expect(screen.getByTestId("hex-map-viewport").getAttribute("data-pan")).toBe("45,20");
  });
});
