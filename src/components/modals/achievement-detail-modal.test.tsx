import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AchievementDetailModal } from "./achievement-detail-modal";
import type { Achievement } from "@/types";

const mockUnlockedAchievement: Achievement = {
  id: "first-commit",
  title: "First Step",
  description: "Push your first commit to GitHub.",
  icon: "GitCommit",
  category: "Milestones",
  rarity: "common",
  isUnlocked: true,
  unlockedAt: "2026-03-01T12:00:00Z",
  progress: 1,
  target: 1,
  xpReward: 50,
};

const mockLockedAchievement: Achievement = {
  id: "century-club",
  title: "Century Club",
  description: "Reach 100 merged pull requests.",
  icon: "Award",
  category: "Milestones",
  rarity: "legendary",
  isUnlocked: false,
  progress: 42,
  target: 100,
  xpReward: 500,
};

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AchievementDetailModal", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  it("renders modal details for unlocked achievement", () => {
    render(
      <AchievementDetailModal
        isOpen={true}
        onClose={vi.fn()}
        achievement={mockUnlockedAchievement}
      />
    );

    expect(screen.getByText("First Step")).toBeInTheDocument();
    expect(screen.getByText("Push your first commit to GitHub.")).toBeInTheDocument();
    expect(screen.getByText("common")).toBeInTheDocument();
    expect(screen.getByText("+50 XP")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Share on X/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy Link/i })).toBeInTheDocument();
  });

  it("does not render when closed or achievement is null", () => {
    const { rerender } = render(
      <AchievementDetailModal
        isOpen={false}
        onClose={vi.fn()}
        achievement={mockUnlockedAchievement}
      />
    );
    expect(screen.queryByText("First Step")).not.toBeInTheDocument();

    rerender(
      <AchievementDetailModal
        isOpen={true}
        onClose={vi.fn()}
        achievement={null}
      />
    );
    expect(screen.queryByText("First Step")).not.toBeInTheDocument();
  });

  it("renders locked state with progress requirements for locked achievements", () => {
    render(
      <AchievementDetailModal
        isOpen={true}
        onClose={vi.fn()}
        achievement={mockLockedAchievement}
      />
    );

    expect(screen.getByText("Century Club")).toBeInTheDocument();
    expect(screen.getByText(/Locked \(42%\)/i)).toBeInTheDocument();
    expect(screen.getByText("42 / 100")).toBeInTheDocument();
    expect(screen.getByText("+500 XP")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Share on X/i })).not.toBeInTheDocument();
  });

  it("handles Twitter sharing correctly", () => {
    render(
      <AchievementDetailModal
        isOpen={true}
        onClose={vi.fn()}
        achievement={mockUnlockedAchievement}
      />
    );

    const twitterBtn = screen.getByRole("button", { name: /Share on X/i });
    fireEvent.click(twitterBtn);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://twitter.com/intent/tweet"),
      "_blank",
      expect.any(String)
    );
  });

  it("copies link and markdown badge to clipboard", async () => {
    render(
      <AchievementDetailModal
        isOpen={true}
        onClose={vi.fn()}
        achievement={mockUnlockedAchievement}
      />
    );

    const copyLinkBtn = screen.getByRole("button", { name: /Copy Link/i });
    await act(async () => {
      fireEvent.click(copyLinkBtn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    const copyMarkdownBtn = screen.getByRole("button", { name: /Copy README Badge Markdown/i });
    await act(async () => {
      fireEvent.click(copyMarkdownBtn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("[![CodePulse Achievement:")
    );
  });

  it("triggers onClose when Close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <AchievementDetailModal
        isOpen={true}
        onClose={onClose}
        achievement={mockUnlockedAchievement}
      />
    );

    const closeBtns = screen.getAllByRole("button", { name: /Close/i });
    fireEvent.click(closeBtns[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
