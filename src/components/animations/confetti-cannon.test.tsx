import * as React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";
import confetti from "canvas-confetti";

import {
  ConfettiCannon,
  fireConfettiCannon,
  CONFETTI_PALETTES,
} from "./confetti-cannon";

describe("ConfettiCannon Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders default button with celebrate text and sparkles icon", () => {
    render(<ConfettiCannon />);

    const button = screen.getByRole("button", { name: /celebrate/i });
    expect(button).toBeInTheDocument();
  });

  it("fires confetti on button click and shows celebrating state", () => {
    render(<ConfettiCannon durationMs={1000} />);

    const button = screen.getByRole("button", { name: /celebrate/i });
    fireEvent.click(button);

    expect(confetti).toHaveBeenCalled();
    expect(screen.getByText(/celebrating!/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/celebrate/i)).toBeInTheDocument();
  });

  it("fires automatically when fire prop changes to true", () => {
    const { rerender } = render(<ConfettiCannon fire={false} />);
    expect(confetti).not.toHaveBeenCalled();

    rerender(<ConfettiCannon fire={true} />);
    expect(confetti).toHaveBeenCalled();
  });

  it("renders custom children and handles click and keyboard interactions", () => {
    render(
      <ConfettiCannon>
        <span>Custom Celebrate Trigger</span>
      </ConfettiCannon>
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveTextContent("Custom Celebrate Trigger");

    fireEvent.click(trigger);
    expect(confetti).toHaveBeenCalled();

    // Keyboard trigger
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(confetti).toHaveBeenCalled();
  });

  it("does not fire when disabled is true", () => {
    render(<ConfettiCannon disabled={true} />);

    const button = screen.getByRole("button", { name: /celebrate/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(confetti).not.toHaveBeenCalled();
  });

  it("calls onComplete callback after duration finishes", () => {
    const onComplete = vi.fn();
    render(<ConfettiCannon durationMs={500} onComplete={onComplete} />);

    const button = screen.getByRole("button", { name: /celebrate/i });
    fireEvent.click(button);

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("supports standalone programmatic helper fireConfettiCannon", () => {
    fireConfettiCannon({ mode: "center-burst", colors: CONFETTI_PALETTES.gold });
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        spread: 80,
        origin: { x: 0.5, y: 0.6 },
        colors: CONFETTI_PALETTES.gold,
      })
    );

    fireConfettiCannon({ mode: "star-blast" });
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        shapes: ["star"],
      })
    );
  });
});
