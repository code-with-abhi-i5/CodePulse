import { describe, it, expect } from "vitest";
import { calculateChallengeProgress } from "./use-challenges";
import type { User } from "./use-auth";

describe("calculateChallengeProgress", () => {
  const mockUser: User = {
    id: "user-test",
    username: "coder",
    name: "Coder Test",
    avatar: null,
    bio: null,
    stats: {
      totalCommits: 145,
      totalPRs: 12,
      totalIssues: 8,
      totalStars: 25,
      streak: 5,
      todayCommits: 3,
      weeklyPRs: 2,
    },
    activities: [
      {
        id: "act-1",
        type: "commit",
        title: "fix: bug",
        description: "fixed bug",
        createdAt: new Date().toISOString(), // today
      },
      {
        id: "act-2",
        type: "commit",
        title: "feat: add feature",
        description: "added feature",
        createdAt: new Date().toISOString(), // today
      },
      {
        id: "act-3",
        type: "pull_request",
        title: "PR: performance improvement",
        description: "improved performance",
        createdAt: new Date().toISOString(), // this week
      },
    ],
    repositories: [
      {
        id: "repo-1",
        name: "awesome-app",
        fullName: "coder/awesome-app",
        description: "my app",
        language: "TypeScript",
        languageColor: "#3178c6",
        stars: 15,
        forks: 3,
        watchers: 5,
        issues: 2,
        pullRequests: 1,
        commits: 50,
        contributors: 1,
        size: 1024,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        topics: [],
        isPrivate: false,
        url: "https://github.com/coder/awesome-app",
      },
    ],
  };

  it("tracks today's commit count against daily target (e.g., 2/5 commits)", () => {
    const challenge = {
      title: "Daily Committer",
      description: "Make 5 commits today",
      category: "COMMITS",
      type: "DAILY",
      target: 5,
    };

    const result = calculateChallengeProgress(challenge, mockUser);

    expect(result.current).toBe(2); // 2 commits created today in mockUser.activities
    expect(result.progress).toBe(2);
    expect(result.percentage).toBe(40); // 2 / 5 = 40%
    expect(result.isCompleted).toBe(false);
  });

  it("marks Daily Commit challenge as completed when progress >= target", () => {
    const challenge = {
      title: "Daily Quick Commit",
      description: "Make 2 commits today",
      category: "COMMITS",
      type: "DAILY",
      target: 2,
    };

    const result = calculateChallengeProgress(challenge, mockUser);

    expect(result.current).toBe(2);
    expect(result.progress).toBe(2);
    expect(result.percentage).toBe(100);
    expect(result.isCompleted).toBe(true);
  });

  it("tracks weekly merged PR count against target for Weekly PR Challenge", () => {
    const challenge = {
      title: "Weekly PR Challenge",
      description: "Merge 3 pull requests this week",
      category: "PRS",
      type: "WEEKLY",
      target: 3,
    };

    const result = calculateChallengeProgress(challenge, mockUser);

    expect(result.current).toBe(1); // 1 PR in activities this week
    expect(result.progress).toBe(1);
    expect(result.percentage).toBe(33);
    expect(result.isCompleted).toBe(false);
  });

  it("marks Star Collector challenge as completed when user stars >= milestone target", () => {
    const challenge = {
      title: "Star Collector",
      description: "Reach 20 repository stars",
      category: "STARS",
      type: "MONTHLY",
      target: 20,
    };

    const result = calculateChallengeProgress(challenge, mockUser);

    expect(result.current).toBe(25); // totalStars: 25
    expect(result.progress).toBe(20); // capped at target
    expect(result.percentage).toBe(100);
    expect(result.isCompleted).toBe(true);
  });

  it("calculates percentage accurately: Math.min(100, Math.round((current / target) * 100))", () => {
    const challenge = {
      title: "Commit Sprint",
      description: "Make 7 commits",
      category: "COMMITS",
      type: "WEEKLY",
      target: 7,
    };

    // User with 5 commits
    const customUser: User = {
      ...mockUser,
      activities: [],
      stats: { ...mockUser.stats, weeklyCommits: 5 },
    };

    const result = calculateChallengeProgress(challenge, customUser);

    expect(result.current).toBe(5);
    expect(result.percentage).toBe(71); // Math.round((5 / 7) * 100) = 71
    expect(result.isCompleted).toBe(false);
  });

  it("handles empty or null user gracefully without throwing errors", () => {
    const challenge = {
      title: "Daily Committer",
      target: 5,
      progress: 3,
    };

    const result = calculateChallengeProgress(challenge, null);

    expect(result.progress).toBe(3);
    expect(result.percentage).toBe(60);
    expect(result.isCompleted).toBe(false);
  });
});
