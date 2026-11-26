import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminDisputeDashboard, DEFAULT_DISPUTE_FRAMES } from "./page";

describe("AdminDisputeDashboard (Millisecond Scrubber, Diff Inspection & Override Rulings)", () => {
  it("synchronizes player snapshots at scrubbed millisecond timestamps and records override rulings", () => {
    render(<AdminDisputeDashboard frames={DEFAULT_DISPUTE_FRAMES} />);

    const scrubber = screen.getByTestId("timeline-scrubber");
    fireEvent.change(scrubber, { target: { value: "3500" } });

    expect(screen.getByTestId("scrubber-timestamp-ms").textContent).toContain("3500 ms");
    expect(screen.getByTestId("player-b-code").textContent).toContain("if (!a) return 0;");
    expect(screen.getByTestId("server-test-output").textContent).toContain("Compiler runner timeout");

    fireEvent.click(screen.getByTestId("ruling-AWARD_WIN_PLAYER_A"));
    expect(screen.getByTestId("adjudication-ruling-banner").textContent).toContain(
      "AWARD_WIN_PLAYER_A",
    );
  });
});
