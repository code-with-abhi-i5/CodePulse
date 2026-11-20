"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Volume2, VolumeX, Swords } from "lucide-react";
import { BattleSetup } from "@/components/battles/battle-setup";
import { BattleIntro } from "@/components/battles/battle-intro";
import { BattleRounds } from "@/components/battles/battle-rounds";
import { BattleReport } from "@/components/battles/battle-report";
import { BattleMatchmakingSkeleton } from "@/components/battles/battle-skeleton";
import { BattleHistoryList, type HistoricalBattle } from "@/components/battles/battle-history-list";
import { BattleQueueDialog } from "@/components/battles/battle-queue-dialog";
import { useCurrentUser } from "@/hooks/api/use-auth";
import { Button } from "@/components/ui/button";
import { BotSelector } from "@/components/battles/bot-selector";
import { BOT_ARCHETYPES, BotArchetype, botToDevData } from "@/lib/bot-archetypes";

type BattlePhase = "SETUP" | "INTRO" | "ROUNDS" | "REPORT";

export default function BattlesPage() {
  const { data: currentUser } = useCurrentUser();
  const [phase, setPhase] = useState<BattlePhase>("SETUP");
  const [ghostBattleData, setGhostBattleData] = useState<{ p1: any; p2: any; battleType: string; selectedBot?: BotArchetype } | null>(null);
  const [setupUsernames, setSetupUsernames] = useState<{ p1: string; p2: string; battleType: string } | null>(null);
  const [selectedBot, setSelectedBot] = useState<BotArchetype | null>(null);
  const [initialP1, setInitialP1] = useState("");
  const [initialP2, setInitialP2] = useState("");
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [battleHistory, setBattleHistory] = useState<HistoricalBattle[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [focusSetupOnReturn, setFocusSetupOnReturn] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("devbattle_battle_history");
        if (saved) {
          setBattleHistory(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to load battle history:", e);
      }
    }
  }, []);

  const saveBattleToHistory = (p1: any, p2: any, battleType: string, selectedBot?: BotArchetype) => {
    try {
      const calc = (s: any) =>
        (s?.totalCommits || 0) * 1 +
        (s?.totalPRs || 0) * 5 +
        (s?.totalStars || 0) * 10 +
        (s?.followers || 0) * 2 +
        (s?.streak || 0) * 5;

      const p1Score = p1?.score || calc(p1?.stats) || 85;
      const p2Score = p2?.score || calc(p2?.stats) || 70;
      const winner = p1Score > p2Score ? "p1" : p1Score < p2Score ? "p2" : "draw";
      let xpChange = Math.abs(Math.round((p1Score - p2Score) * 0.15)) + 15;

      // Winning against a harder AI bot awards scaled XP
      if (battleType === "AI Battle" && selectedBot) {
        xpChange = Math.round(xpChange * selectedBot.xpMultiplier);
      }

      const newRecord: HistoricalBattle = {
        id: `battle-${Date.now()}`,
        player1: p1,
        player2: p2,
        battleType,
        winner,
        p1Score,
        p2Score,
        xpChange,
        createdAt: new Date().toISOString(),
      };

      setBattleHistory((prev) => {
        const updated = [newRecord, ...prev.filter((b) => b.id !== newRecord.id)].slice(0, 20);
        if (typeof window !== "undefined") {
          localStorage.setItem("devbattle_battle_history", JSON.stringify(updated));
        }
        return updated;
      });
    } catch (e) {
      console.error("Error saving battle history:", e);
    }
  };

  // Read URL query parameters (e.g. /battles?p2=<username>)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const p2 = params.get("p2") || params.get("opponent") || params.get("vs");
      const p1 = params.get("p1") || currentUser?.username || "code-with-abhi-i5";
      if (p2) {
        setInitialP2(p2);
      }
      if (p1) {
        setInitialP1(p1);
      }
    }
  }, [currentUser]);

  // Global sound effects mute toggle
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("devbattle_sound_muted") === "true";
    }
    return false;
  });

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("devbattle_sound_muted", String(next));
      }
      toast(next ? "Sound effects muted" : "Sound effects enabled", {
        icon: next ? "🔇" : "🔊",
        duration: 2000,
      });
      return next;
    });
  }, []);

  const startGhostBattle = useCallback(async (p1: string, p2: string, battleType: string, selectedBot?: BotArchetype) => {
    setSetupUsernames({ p1, p2, battleType });
    setIsIntroFinished(false);
    setPhase("INTRO");

    try {
      let p1Data: any;
      let p2Data: any;

      if (battleType === "AI Battle" && selectedBot) {
        const res1 = await fetch(`/api/github/developer?username=${p1}`);
        if (!res1.ok) {
          throw new Error("Could not find the GitHub user.");
        }
        p1Data = await res1.json();
        p2Data = botToDevData(selectedBot);
      } else {
        const [res1, res2] = await Promise.all([
          fetch(`/api/github/developer?username=${p1}`),
          fetch(`/api/github/developer?username=${p2}`),
        ]);

        if (!res1.ok || !res2.ok) {
          throw new Error("Could not find one or both GitHub users.");
        }

        p1Data = await res1.json();
        p2Data = await res2.json();
      }

      setGhostBattleData({ p1: p1Data, p2: p2Data, battleType, selectedBot: battleType === "AI Battle" ? selectedBot : undefined });
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate battle.");
      setPhase("SETUP");
    }
  }, []);

  // Deep-linking / Quick Battle trigger from Command Palette or URL params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const opponent = params.get("p2") || params.get("opponent") || params.get("vs");
      const p1 = params.get("p1") || currentUser?.username || "code-with-abhi-i5";
      const battleType = params.get("type") || "Overall Battle";

      if (opponent) {
        startGhostBattle(p1, opponent, battleType);
      }
    }
  }, [currentUser]);

  const handleIntroComplete = () => {
    setIsIntroFinished(true);
  };

  // Support shared battle links: /battles?p1=user1&p2=user2
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const p1 = params.get("p1");
      const p2 = params.get("p2");
      if (p1 && p2 && phase === "SETUP") {
        toast.info(`Loading shared battle: ${p1} vs ${p2}`, {
          description: "Initiating live developer metrics comparison...",
        });
        startGhostBattle(p1, p2, "Overall Battle");
      }
    }
  }, [startGhostBattle]);

  // Transition to ROUNDS only when BOTH intro animation finished AND data loaded
  useEffect(() => {
    if (phase === "INTRO" && isIntroFinished && ghostBattleData) {
      setPhase("ROUNDS");
    }
  }, [phase, isIntroFinished, ghostBattleData]);

  return (
    <div className="w-full relative min-h-[calc(100vh-80px)]">
      {/* Top Battle Header with Global Controls */}
      <div className="w-full flex items-center justify-between pb-6 border-b border-border/40 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              DevBattle Arena
            </h1>
            <p className="text-xs text-muted-foreground">
              1v1 Head-to-Head Developer Face-Off
            </p>
          </div>
        </div>

        {/* Global Sound Effects Mute Toggle Button */}
        <button
          onClick={toggleMute}
          aria-pressed={isMuted}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card/60 backdrop-blur-md hover:bg-accent text-xs font-medium transition-all shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title={isMuted ? "Sound effects currently muted (click to unmute)" : "Sound effects enabled (click to mute)"}
          aria-label={isMuted ? "Sound effects muted" : "Sound effects enabled"}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground hidden sm:inline">Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="text-foreground hidden sm:inline">Sound On</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {phase === "SETUP" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="flex justify-end">
              <Button
                onClick={() => setIsQueueOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold py-2.5 px-5 rounded-2xl shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Swords className="w-4 h-4" />
                <span>Quick Matchmaking Queue</span>
              </Button>
            </div>

            <BattleSetup
              onStart={startGhostBattle}
              initialPlayer1={initialP1}
              initialPlayer2={initialP2}
              focusFirstInput={focusSetupOnReturn}
            />

            <BotSelector onSelect={setSelectedBot} />

            <BattleHistoryList
              battles={battleHistory}
              onReplay={(battle) => {
                setGhostBattleData({
                  p1: battle.player1,
                  p2: battle.player2,
                  battleType: battle.battleType,
                });
                setPhase("REPORT");
              }}
              onStartNew={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </motion.div>
        )}

        {phase === "INTRO" && setupUsernames && !isIntroFinished && (
          <BattleIntro
            key="intro"
            p1Username={setupUsernames.p1}
            p2Username={setupUsernames.p2}
            selectedBot={selectedBot}
            isBotBattle={setupUsernames.battleType === "AI Battle"}
            onIntroComplete={handleIntroComplete}
          />
        )}

        {phase === "INTRO" && setupUsernames && isIntroFinished && !ghostBattleData && (
          <motion.div
            key="matchmaking-skeleton"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="pt-6"
          >
            <BattleMatchmakingSkeleton
              p1Username={setupUsernames.p1}
              p2Username={setupUsernames.p2}
              battleType={setupUsernames.battleType}
            />
          </motion.div>
        )}

        {phase === "ROUNDS" && ghostBattleData && (
          <motion.div
            key="rounds"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <BattleRounds
              player1={ghostBattleData.p1}
              player2={ghostBattleData.p2}
              battleType={ghostBattleData.battleType}
              isMuted={isMuted}
              selectedBot={ghostBattleData.selectedBot}
              isBotBattle={ghostBattleData.battleType === "AI Battle"}
              onComplete={() => {
                saveBattleToHistory(ghostBattleData.p1, ghostBattleData.p2, ghostBattleData.battleType, ghostBattleData.selectedBot);
                setPhase("REPORT");
              }}
            />
          </motion.div>
        )}

        {phase === "REPORT" && ghostBattleData && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4"
          >
            <BattleReport
              player1={ghostBattleData.p1}
              player2={ghostBattleData.p2}
              battleType={ghostBattleData.battleType}
              isMuted={isMuted}
              selectedBot={ghostBattleData.selectedBot}
              onToggleMute={toggleMute}
              onRematch={() => {
                setGhostBattleData(null);
                setSetupUsernames(null);
                setFocusSetupOnReturn(true);
                setPhase("SETUP");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Matchmaking Queue Dialog */}
      <BattleQueueDialog
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        currentUser={currentUser}
        onMatchFound={(opponent) => {
          setIsQueueOpen(false);
          startGhostBattle(
            currentUser?.username || "currentdev",
            opponent.username,
            "overall"
          );
        }}
      />
    </div>
  );
}
