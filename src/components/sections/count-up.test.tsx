import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CountUp } from "./count-up";

describe("CountUp", () => {
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrameId = 0;

  afterEach(() => {
    frames.clear();
    vi.unstubAllGlobals();
    nextFrameId = 0;
  });

  it("starts at zero and reaches the formatted target in 2.4 seconds", () => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      const id = ++nextFrameId;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));

    const { rerender } = render(
      <CountUp target={250} suffix="K+" isVisible={false} reducedMotion={false} />
    );
    expect(screen.getByText("0K+")).toBeInTheDocument();

    rerender(<CountUp target={250} suffix="K+" isVisible reducedMotion={false} />);

    const runFrame = (timestamp: number) => {
      const callbacks = Array.from(frames.values());
      frames.clear();
      act(() => callbacks.forEach((callback) => callback(timestamp)));
    };

    runFrame(1000);
    runFrame(2200);
    expect(screen.getByText("219K+")).toBeInTheDocument();

    runFrame(3400);
    expect(screen.getByText("250K+")).toBeInTheDocument();
  });

  it("shows the final value without animation when reduced motion is enabled", () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const { rerender } = render(
      <CountUp target={250} suffix="K+" isVisible={false} reducedMotion />
    );
    expect(screen.getByText("0K+")).toBeInTheDocument();
    act(() => callbacks.shift()?.(0));
    expect(screen.getByText("250K+")).toBeInTheDocument();
    rerender(<CountUp target={12} suffix="M+" isVisible={false} reducedMotion />);
    act(() => callbacks.shift()?.(16));
    expect(screen.getByText("12M+")).toBeInTheDocument();
    rerender(<CountUp target={500} suffix="K+" isVisible={false} reducedMotion />);
    act(() => callbacks.shift()?.(32));
    expect(screen.getByText("500K+")).toBeInTheDocument();
    rerender(
      <CountUp
        target={99.9}
        suffix="%"
        decimalPlaces={1}
        isVisible={false}
        reducedMotion
      />
    );
    act(() => callbacks.shift()?.(48));
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(callbacks).toHaveLength(0);
  });

  it("cancels a pending animation frame when unmounted", () => {
    const cancelFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 17));
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);

    const { unmount } = render(
      <CountUp target={250} suffix="K+" isVisible reducedMotion={false} />
    );
    unmount();

    expect(cancelFrame).toHaveBeenCalledWith(17);
  });
});
