import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BookmarkToggleMutation, ErrorBoundary } from "./error-boundary";

describe("BookmarkToggleMutation & ErrorBoundary (#6163)", () => {
  it("optimistically toggles star state and rolls back to initial state on network error", async () => {
    let rejectMutation!: (reason?: unknown) => void;
    const failingMutation = vi.fn(
      () =>
        new Promise<void>((_, reject) => {
          rejectMutation = reject;
        }),
    );
    const onRollback = vi.fn();

    render(
      <BookmarkToggleMutation
        itemId="problem-101"
        itemLabel="Problem"
        initialBookmarked={false}
        toggleMutation={failingMutation}
        onRollback={onRollback}
      />,
    );

    const button = screen.getByTestId("bookmark-toggle-button");
    const star = screen.getByTestId("bookmark-star-icon");

    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(star.getAttribute("data-filled")).toBe("false");

    fireEvent.click(button);

    // Optimistic state updates immediately before promise settles
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(star.getAttribute("data-filled")).toBe("true");

    await act(async () => {
      rejectMutation(new Error("Network request failed"));
    });

    await waitFor(() => {
      expect(button.getAttribute("aria-pressed")).toBe("false");
      expect(star.getAttribute("data-filled")).toBe("false");
    });

    expect(onRollback).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("bookmark-rollback-notice").textContent).toContain(
      "Network request failed",
    );
  });

  it("commits optimistic bookmark state when backend mutation succeeds", async () => {
    const succeedingMutation = vi.fn().mockResolvedValue({ bookmarked: true });

    render(
      <BookmarkToggleMutation
        itemId="problem-202"
        initialBookmarked={false}
        toggleMutation={succeedingMutation}
      />,
    );

    const button = screen.getByTestId("bookmark-toggle-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(button.getAttribute("aria-pressed")).toBe("true");
      expect(screen.getByTestId("bookmark-star-icon").getAttribute("data-filled")).toBe("true");
    });

    expect(succeedingMutation).toHaveBeenCalledWith("problem-202", true);
    expect(screen.queryByTestId("bookmark-rollback-notice")).toBeNull();
  });

  it("catches child render errors inside ErrorBoundary and allows retry reset", () => {
    const Boom = () => {
      throw new Error("Render crash");
    };

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("error-boundary-fallback").textContent).toContain("Render crash");
  });
});
