import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BotSelector } from "./bot-selector";
import { BOT_ARCHETYPES } from "@/lib/bot-archetypes";

describe("BotSelector", () => {
  it("renders all four bot cards", () => {
    const { container } = render(<BotSelector onSelect={vi.fn()} />);
    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards).toHaveLength(4);
    for (const bot of BOT_ARCHETYPES) {
      expect(screen.getAllByText(bot.name).length).toBeGreaterThan(0);
      expect(screen.getAllByText(bot.tagline).length).toBeGreaterThan(0);
      expect(screen.getAllByText(`×${bot.xpMultiplier} XP`).length).toBeGreaterThan(0);
    }
  });

  it("displays stats for each bot: win rate, language, difficulty rating", () => {
    render(<BotSelector onSelect={vi.fn()} />);
    for (const bot of BOT_ARCHETYPES) {
      expect(screen.getAllByText(`${bot.winRate}%`).length).toBeGreaterThan(0);
      expect(screen.getAllByText(bot.favoriteLanguage).length).toBeGreaterThan(0);
    }
  });

  it("calls onSelect with the chosen bot", () => {
    const onSelect = vi.fn();
    const { container } = render(<BotSelector onSelect={onSelect} />);
    const hardBot = BOT_ARCHETYPES.find((b) => b.difficulty === "hard")!;

    const buttons = container.querySelectorAll('button');
    const hardButton = Array.from(buttons).find(
      (b) => b.textContent === "Select Bot" && b.closest('[data-slot="card"]')?.textContent?.includes(hardBot.name)
    );
    expect(hardButton).toBeDefined();
    fireEvent.click(hardButton!);
    expect(onSelect).toHaveBeenCalledWith(hardBot);
  });

  it("highlights the selected bot card", () => {
    const { container } = render(<BotSelector onSelect={vi.fn()} selectedId="turing-titan" />);
    const cards = container.querySelectorAll('[data-slot="card"]');
    const titanCard = Array.from(cards).find((c) => c.textContent?.includes("Turing Titan"));
    expect(titanCard).toHaveClass("ring-primary");
    expect(screen.getByText(/selected ✓/i)).toBeInTheDocument();
  });

  it("shows the selected bot summary bar", () => {
    render(<BotSelector onSelect={vi.fn()} selectedId="senior-sage" />);
    expect(screen.getByText(/selected:/i)).toBeInTheDocument();
    expect(screen.getAllByText("Senior Sage").length).toBeGreaterThan(0);
    expect(screen.getAllByText("×1.25 XP").length).toBeGreaterThan(0);
  });
});
