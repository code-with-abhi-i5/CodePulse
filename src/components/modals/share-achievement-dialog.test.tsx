import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareAchievementDialog } from "./share-achievement-dialog";
import type { Achievement } from "@/types";

describe("ShareAchievementDialog - Escape Key Listener & Accessibility", () => {
  const onClose = vi.fn();

  const mockAchievement: Achievement = {
    id: "ach_101",
    title: "Algorithm Grandmaster",
    description: "Ranked in top 1% globally for algorithmic battles",
    icon: "trophy",
    category: "battles",
    rarity: "legendary",
    isUnlocked: true,
    unlockedAt: "2026-11-28T12:00:00Z",
    progress: 100,
    target: 100,
    xpReward: 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with accessible dialog role, aria-modal, and headings when open", () => {
    render(
      <ShareAchievementDialog
        isOpen={true}
        onClose={onClose}
        achievement={mockAchievement}
      />
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "share-achievement-title");
    expect(dialog).toHaveAttribute("aria-describedby", "share-achievement-desc");

    expect(screen.getByText("Algorithm Grandmaster")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close share achievement dialog" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy Link/i })).toBeInTheDocument();
  });

  it("renders nothing when isOpen is false", () => {
    render(
      <ShareAchievementDialog
        isOpen={false}
        onClose={onClose}
        achievement={mockAchievement}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes dialog immediately when Escape key is pressed from anywhere on window", () => {
    render(
      <ShareAchievementDialog
        isOpen={true}
        onClose={onClose}
        achievement={mockAchievement}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes dialog immediately when Escape key is pressed on a child element", () => {
    render(
      <ShareAchievementDialog
        isOpen={true}
        onClose={onClose}
        achievement={mockAchievement}
      />
    );

    const copyBtn = screen.getByRole("button", { name: /Copy Link/i });
    fireEvent.keyDown(copyBtn, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("traps keyboard focus with forward Tab and backward Shift+Tab cycling", async () => {
    render(
      <ShareAchievementDialog
        isOpen={true}
        onClose={onClose}
        achievement={mockAchievement}
      />
    );

    const dialog = screen.getByRole("dialog");
    const closeBtn = screen.getByRole("button", { name: "Close share achievement dialog" });
    const copyLinkBtn = screen.getByRole("button", { name: /Copy Link/i });

    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    // Move to last focusable button
    copyLinkBtn.focus();
    expect(document.activeElement).toBe(copyLinkBtn);

    // Tab wraps around to first element (Close X button)
    fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);

    // Shift + Tab wraps backward to last element
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(copyLinkBtn);
  });

  it("renders battle victory details when victory prop is passed", () => {
    render(
      <ShareAchievementDialog
        isOpen={true}
        onClose={onClose}
        victory={{
          battleId: "battle_42",
          opponentName: "CodeSlayer",
          challengeTitle: "Dijkstra Optimization",
          xpEarned: 300,
          eloChange: 45,
        }}
      />
    );

    expect(screen.getByText("Victory Over CodeSlayer")).toBeInTheDocument();
    expect(screen.getByText("+45 ELO")).toBeInTheDocument();
    expect(screen.getByText("+300 XP")).toBeInTheDocument();
  });

  it("triggers clipboard copy on Copy Link click", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(
      <ShareAchievementDialog
        isOpen={true}
        onClose={onClose}
        achievement={mockAchievement}
      />
    );

    const copyBtn = screen.getByRole("button", { name: /Copy Link/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
