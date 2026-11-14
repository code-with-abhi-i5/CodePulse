import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AchievementsPage from "./page";
import type { Achievement } from "@/types";

const mockAchievements: Achievement[] = [
  {
    id: "first-pr",
    title: "Pull Request Pioneer",
    description: "Open your first pull request on GitHub.",
    icon: "GitCommit",
    category: "Milestones",
    rarity: "common",
    isUnlocked: true,
    unlockedAt: "2026-02-15T10:00:00Z",
    progress: 1,
    target: 1,
    xpReward: 100,
  },
  {
    id: "legend-coder",
    title: "Code Immortal",
    description: "Earn 10,000 rating points and top the global leaderboard.",
    icon: "Award",
    category: "Popularity",
    rarity: "legendary",
    isUnlocked: false,
    progress: 2500,
    target: 10000,
    xpReward: 1000,
  },
  {
    id: "speed-demon",
    title: "Speed Demon",
    description: "Resolve an issue within 30 minutes.",
    icon: "Flame",
    category: "Consistency",
    rarity: "epic",
    isUnlocked: true,
    progress: 1,
    target: 1,
    xpReward: 300,
  },
];

vi.mock("@/hooks/api/use-auth", () => ({
  useCurrentUser: vi.fn(() => ({
    data: {
      id: "test-user-1",
      username: "nilesh0199",
      achievements: mockAchievements,
    },
    isLoading: false,
  })),
}));

describe("AchievementsPage Component", () => {
  it("renders page header and calculated statistics summary cards", () => {
    render(<AchievementsPage />);

    expect(screen.getByRole("heading", { name: /^Achievements$/i })).toBeInTheDocument();
    // 2 unlocked out of 3 total = 67%
    expect(screen.getByText("67%")).toBeInTheDocument();
    // 100 + 300 = 400 XP
    expect(screen.getByText("+400 XP")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("filters achievements by instant search query", () => {
    render(<AchievementsPage />);

    const searchInput = screen.getByPlaceholderText(/Search achievements by name/i);
    expect(screen.getByText("Pull Request Pioneer")).toBeInTheDocument();
    expect(screen.getByText("Code Immortal")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Immortal" } });
    expect(screen.getByText("Code Immortal")).toBeInTheDocument();
    expect(screen.queryByText("Pull Request Pioneer")).not.toBeInTheDocument();
  });

  it("filters achievements by rarity selector", () => {
    render(<AchievementsPage />);

    const legendaryFilter = screen.getByRole("button", { name: "Legendary" });
    fireEvent.click(legendaryFilter);

    expect(screen.getByText("Code Immortal")).toBeInTheDocument();
    expect(screen.queryByText("Pull Request Pioneer")).not.toBeInTheDocument();
    expect(screen.queryByText("Speed Demon")).not.toBeInTheDocument();
  });

  it("opens AchievementDetailModal when clicking on an achievement card", () => {
    render(<AchievementsPage />);

    const card = screen.getByText("Pull Request Pioneer");
    fireEvent.click(card);

    // Modal dialog should open and show social share button for unlocked achievement
    expect(screen.getByRole("button", { name: /Share on X/i })).toBeInTheDocument();
  });
});
