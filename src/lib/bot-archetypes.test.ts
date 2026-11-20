import { describe, expect, it } from "vitest";
import {
  BOT_ARCHETYPES,
  BotDifficulty,
  botToDevData,
  DEFAULT_BOT,
  getBotByDifficulty,
  getBotById,
} from "./bot-archetypes";

describe("bot archetypes", () => {
  it("defines four difficulty tiers", () => {
    expect(BOT_ARCHETYPES).toHaveLength(4);
    const difficulties = BOT_ARCHETYPES.map((b) => b.difficulty);
    expect(difficulties).toEqual(["easy", "medium", "hard", "legendary"]);
  });

  it("assigns expected accuracy and xp multiplier per tier", () => {
    const byDiff = (d: BotDifficulty) => BOT_ARCHETYPES.find((b) => b.difficulty === d)!;
    expect(byDiff("easy").accuracy).toBe(0.70);
    expect(byDiff("medium").accuracy).toBe(0.85);
    expect(byDiff("hard").accuracy).toBe(0.95);
    expect(byDiff("legendary").accuracy).toBe(0.99);

    expect(byDiff("easy").xpMultiplier).toBe(1.0);
    expect(byDiff("medium").xpMultiplier).toBe(1.25);
    expect(byDiff("hard").xpMultiplier).toBe(1.5);
    expect(byDiff("legendary").xpMultiplier).toBe(2.0);
  });

  it("has monotonic difficulty rating and win rate", () => {
    const ratings = BOT_ARCHETYPES.map((b) => b.difficultyRating);
    const winRates = BOT_ARCHETYPES.map((b) => b.winRate);
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i]).toBeGreaterThan(ratings[i - 1]);
      expect(winRates[i]).toBeGreaterThan(winRates[i - 1]);
    }
  });

  it("getBotById returns the correct bot", () => {
    expect(getBotById("turing-titan")?.name).toBe("Turing Titan");
    expect(getBotById("junior-junebug")?.difficulty).toBe("easy");
    expect(getBotById("does-not-exist")).toBeUndefined();
  });

  it("getBotByDifficulty returns the correct bot", () => {
    expect(getBotByDifficulty("legendary")?.id).toBe("turing-titan");
    expect(getBotByDifficulty("easy")?.id).toBe("junior-junebug");
  });

  it("DEFAULT_BOT is the easy bot", () => {
    expect(DEFAULT_BOT.id).toBe("junior-junebug");
  });

  it("botToDevData produces valid dev data scaled by difficulty", () => {
    const easy = botToDevData(getBotById("junior-junebug")!);
    const legendary = botToDevData(getBotById("turing-titan")!);

    expect(easy.username).toBe("junior-junebug");
    expect(easy.name).toBe("Junior Junebug");
    expect(easy.avatar).toContain("dicebear");
    expect(easy.stats.totalCommits).toBeGreaterThan(0);
    expect(easy.score).toBeGreaterThan(0);

    // Legendary bots have higher stats than easy bots
    expect(legendary.stats.totalCommits).toBeGreaterThan(easy.stats.totalCommits);
    expect(legendary.score).toBeGreaterThan(easy.score);
  });

  it("every archetype has non-empty banter and an avatar", () => {
    for (const bot of BOT_ARCHETYPES) {
      expect(bot.banter.length).toBeGreaterThan(0);
      expect(bot.avatar).toBeTruthy();
      expect(bot.favoriteLanguage).toBeTruthy();
    }
  });
});
