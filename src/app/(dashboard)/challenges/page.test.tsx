import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChallengesPage from "./page";

vi.mock("@/components/modals/claim-reward-modal", () => ({
  ClaimRewardModal: () => null,
}));

const mockUseActiveChallenges = vi.fn();
const mockUseCurrentUser = vi.fn();

vi.mock("@/hooks/api/use-challenges", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/api/use-challenges")>();
  return {
    ...actual,
    useActiveChallenges: () => mockUseActiveChallenges(),
  };
});

vi.mock("@/hooks/api/use-auth", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

describe("ChallengesPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActiveChallenges.mockReturnValue({
      data: [
        {
          id: "ch-active-1",
          title: "Daily Committer",
          description: "Make 5 commits today",
          type: "DAILY",
          difficulty: "easy",
          xpReward: 50,
          target: 5,
          category: "COMMITS",
          icon: "Flame",
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: "ch-completed-1",
          title: "Star Collector",
          description: "Collect 10 stars",
          type: "MONTHLY",
          difficulty: "hard",
          xpReward: 500,
          target: 10,
          category: "STARS",
          icon: "Target",
          expiresAt: new Date(Date.now() + 864000000).toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    });

    mockUseCurrentUser.mockReturnValue({
      data: {
        id: "user-1",
        stats: {
          totalCommits: 20,
          todayCommits: 2, // 2 / 5 -> active
          totalStars: 50, // 50 >= 10 -> completed
        },
        rating: { xp: 1200 },
      },
    });
  });

  it("calculates progress and separates active vs completed challenges", () => {
    render(<ChallengesPage />);

    expect(screen.getByText("Challenges")).toBeInTheDocument();

    // Summary cards reflect counts
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);

    // Active challenge shows progress 2/5 (40%)
    expect(screen.getByText("Daily Committer")).toBeInTheDocument();
    expect(screen.getByText(/2\/5/)).toBeInTheDocument();
    expect(screen.getByText(/\(40%\)/)).toBeInTheDocument();

    // Completed challenge shows completed badge and 10/10 (100%)
    expect(screen.getByText("Star Collector")).toBeInTheDocument();
    expect(screen.getByText(/10\/10/)).toBeInTheDocument();
    expect(screen.getByText(/\(100%\)/)).toBeInTheDocument();
  });

  it("filters accurately when switching to Completed tab", () => {
    render(<ChallengesPage />);

    // Click Completed tab
    const completedTab = screen.getByRole("tab", { name: /Completed/i });
    fireEvent.click(completedTab);

    // Completed challenge is visible
    expect(screen.getByText("Star Collector")).toBeInTheDocument();

    // In-progress active challenge is hidden
    expect(screen.queryByText("Daily Committer")).not.toBeInTheDocument();
  });

  it("filters accurately when switching to Active tab", () => {
    render(<ChallengesPage />);

    // Click Active tab
    const activeTab = screen.getByRole("tab", { name: /Active/i });
    fireEvent.click(activeTab);

    // In-progress challenge is visible
    expect(screen.getByText("Daily Committer")).toBeInTheDocument();

    // Completed challenge is hidden
    expect(screen.queryByText("Star Collector")).not.toBeInTheDocument();
  });
});
