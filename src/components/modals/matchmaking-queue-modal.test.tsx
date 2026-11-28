import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MatchmakingQueueModal } from "./matchmaking-queue-modal";

describe("MatchmakingQueueModal", () => {
  it("renders open modal in searching state with timer and mode info", () => {
    const onClose = vi.fn();
    const onCancelQueue = vi.fn();

    render(
      <MatchmakingQueueModal
        isOpen={true}
        onClose={onClose}
        onCancelQueue={onCancelQueue}
        mode="ranked"
        difficulty="hard"
        estimatedWaitSeconds={20}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/matchmaking queue/i)).toBeInTheDocument();
    expect(screen.getByText(/ranked match/i)).toBeInTheDocument();
    expect(screen.getByText(/• hard/i)).toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText(/est\. wait: ~20s/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel queue/i })).toBeInTheDocument();
  });

  it("calls onCancelQueue and onClose when Cancel Queue button is clicked", () => {
    const onClose = vi.fn();
    const onCancelQueue = vi.fn();

    render(
      <MatchmakingQueueModal
        isOpen={true}
        onClose={onClose}
        onCancelQueue={onCancelQueue}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel queue/i });
    fireEvent.click(cancelButton);

    expect(onCancelQueue).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes and cancels queue on Escape key press", async () => {
    const onClose = vi.fn();
    const onCancelQueue = vi.fn();

    render(
      <MatchmakingQueueModal
        isOpen={true}
        onClose={onClose}
        onCancelQueue={onCancelQueue}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(onCancelQueue).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("renders matched opponent details when queueStatus is found", () => {
    const onAcceptMatch = vi.fn();
    const currentUser = {
      username: "mastercoder",
      rating: 1850,
      avatar: "https://example.com/me.png",
    };
    const opponent = {
      username: "rivaldev",
      tier: "GRANDMASTER",
      rating: 1880,
      avatar: "https://example.com/rival.png",
    };

    render(
      <MatchmakingQueueModal
        isOpen={true}
        queueStatus="found"
        currentUser={currentUser}
        opponent={opponent}
        onAcceptMatch={onAcceptMatch}
      />
    );

    expect(screen.getByText(/opponent found!/i)).toBeInTheDocument();
    expect(screen.getByText("mastercoder")).toBeInTheDocument();
    expect(screen.getByText("1850 ELO")).toBeInTheDocument();
    expect(screen.getByText("rivaldev")).toBeInTheDocument();
    expect(screen.getByText("GRANDMASTER")).toBeInTheDocument();

    const enterButton = screen.getByRole("button", { name: /enter battle now/i });
    expect(enterButton).toBeInTheDocument();

    fireEvent.click(enterButton);
    expect(onAcceptMatch).toHaveBeenCalledWith(opponent);
  });
});
