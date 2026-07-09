"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Search, ChevronDown, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BattleSetupProps {
  onStart: (p1: string, p2: string, battleType: string) => void;
}

const BATTLE_TYPES = [
  "Overall Battle",
  "Repository Battle",
  "Activity Battle",
  "Language Battle",
  "Open Source Impact",
  "AI Battle",
];

export function BattleSetup({ onStart }: BattleSetupProps) {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [battleType, setBattleType] = useState(BATTLE_TYPES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (player1 && player2) {
      onStart(player1, player2, battleType);
    }
  };

  const handleRandom = () => {
    const randomDevs = ["torvalds", "gaearon", "yyx990803", "sindresorhus", "tj", "getify"];
    const p1 = randomDevs[Math.floor(Math.random() * randomDevs.length)];
    let p2 = randomDevs[Math.floor(Math.random() * randomDevs.length)];
    while (p2 === p1) {
      p2 = randomDevs[Math.floor(Math.random() * randomDevs.length)];
    }
    setPlayer1(p1);
    setPlayer2(p2);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Developer Battles</h1>
        <p className="text-muted-foreground">Challenge any developer on GitHub to a data-driven battle.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 md:p-8 shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            {/* Player 1 Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">Challenger</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={player1}
                  onChange={(e) => setPlayer1(e.target.value)}
                  placeholder="GitHub Username"
                  className="w-full bg-background/50 border border-border rounded-xl py-4 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                  required
                />
              </div>
            </div>

            {/* VS Badge */}
            <div className="hidden md:flex w-12 h-12 rounded-full bg-muted border border-border items-center justify-center shrink-0 mt-6 font-black text-muted-foreground text-sm">
              VS
            </div>

            {/* Player 2 Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">Opponent</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-destructive transition-colors" />
                <input
                  type="text"
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  placeholder="GitHub Username"
                  className="w-full bg-background/50 border border-border rounded-xl py-4 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all placeholder:text-muted-foreground/50"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-border/50">
            {/* Battle Type Dropdown */}
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-64 flex items-center justify-between bg-background/50 border border-border rounded-xl px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
              >
                <span>{battleType}</span>
                <ChevronDown className="w-4 h-4 opacity-50" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
                  {BATTLE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setBattleType(type);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-accent transition-colors"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1" />

            <button
              type="button"
              onClick={handleRandom}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm border border-border bg-background/50 hover:bg-accent transition-all flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Random
            </button>

            <button
              type="submit"
              disabled={!player1 || !player2}
              className={cn(
                "w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                !player1 || !player2
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20"
              )}
            >
              Start Battle
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
