import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MatchmakingQueueModal } from "./matchmaking-queue-modal";

describe("MatchmakingQueueModal - Strict Keyboard Focus Trap & Accessibility", () => {
  const onClose = vi.fn();
  const onCancelQueue = vi.fn();
  const onMatchFound = vi.fn();
  const onAcceptMatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with accessible dialog roles, aria-modal, and headings when open", () => {
    render(<MatchmakingQueueModal isOpen onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "matchmaking-dialog-title");
    expect(dialog).toHaveAttribute("aria-describedby", "matchmaking-dialog-desc");

    expect(screen.getByText("Competitive Matchmaking Queue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close matchmaking queue modal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel Matchmaking" })).toBeInTheDocument();
  });

  it("renders nothing when isOpen is false", () => {
    render(<MatchmakingQueueModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("strictly traps Tab and Shift+Tab keyboard focus within modal bounds", async () => {
    // Create an external trigger button to test focus restoration
    const trigger = document.createElement("button");
    trigger.textContent = "Open Matchmaking";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { unmount } = render(<MatchmakingQueueModal isOpen onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    const closeBtn = screen.getByRole("button", { name: "Close matchmaking queue modal" });
    const cancelBtn = screen.getByRole("button", { name: "Cancel Matchmaking" });

    // Initial focus lands inside dialog
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    // 1. Move focus to the last element (cancel button)
    cancelBtn.focus();
    expect(document.activeElement).toBe(cancelBtn);

    // 2. Pressing Tab on the last element wraps focus back to the first element (close button)
    fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);

    // 3. Pressing Shift + Tab on the first element wraps focus backward to the last element (cancel button)
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(cancelBtn);

    unmount();
    document.body.removeChild(trigger);
  });

  it("closes modal on Escape key press and invokes onClose callback", () => {
    render(<MatchmakingQueueModal isOpen onClose={onClose} onCancelQueue={onCancelQueue} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCancelQueue).toHaveBeenCalledTimes(1);
  });

  it("invokes onClose when close (X) button is clicked", () => {
    render(<MatchmakingQueueModal isOpen onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: "Close matchmaking queue modal" });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("invokes onCancelQueue and onClose when Cancel Matchmaking button is clicked", () => {
    render(<MatchmakingQueueModal isOpen onClose={onClose} onCancelQueue={onCancelQueue} />);

    const cancelBtn = screen.getByRole("button", { name: "Cancel Matchmaking" });
    fireEvent.click(cancelBtn);

    expect(onCancelQueue).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("restores keyboard focus back to the previous trigger element upon unmounting/closing", async () => {
    const triggerBtn = document.createElement("button");
    triggerBtn.setAttribute("id", "trigger-matchmaking");
    document.body.appendChild(triggerBtn);
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

    const { rerender } = render(<MatchmakingQueueModal isOpen onClose={onClose} />);

    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    // Close the modal
    rerender(<MatchmakingQueueModal isOpen={false} onClose={onClose} />);

    await waitFor(() => {
      expect(document.activeElement).toBe(triggerBtn);
    });

    document.body.removeChild(triggerBtn);
  });

  it("transitions to match found and allows accepting the battle", async () => {
    vi.useFakeTimers();

    render(
      <MatchmakingQueueModal
        isOpen
        onClose={onClose}
        simulatedWaitSeconds={2}
        onMatchFound={onMatchFound}
        onAcceptMatch={onAcceptMatch}
      />
    );

    expect(screen.getByText("Competitive Matchmaking Queue")).toBeInTheDocument();

    // Fast-forward 2 seconds to simulate finding opponent
    vi.advanceTimersByTime(2100);

    await waitFor(() => {
      expect(screen.getByText("Head-to-Head Opponent Found!")).toBeInTheDocument();
    });

    expect(onMatchFound).toHaveBeenCalled();
    const acceptBtn = screen.getByRole("button", { name: "Accept Battle Now" });
    expect(acceptBtn).toBeInTheDocument();

    fireEvent.click(acceptBtn);
    expect(onAcceptMatch).toHaveBeenCalledWith("match_sim_8921");
  });
});
