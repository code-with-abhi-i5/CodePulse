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

type BattlePhase = "SETUP" | "INTRO" | "ROUNDS" | "REPORT";

export default function BattlesPage() {
  const [phase, setPhase] = useState<BattlePhase>("SETUP");
  const [ghostBattleData, setGhostBattleData] = useState<{ p1: any; p2: any; battleType: string } | null>(null);
  const [setupUsernames, setSetupUsernames] = useState<{ p1: string; p2: string; battleType: string } | null>(null);
  const [isIntroFinished, setIsIntroFinished] = useState(false);

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

  const startGhostBattle = useCallback(async (p1: string, p2: string, battleType: string) => {
    setSetupUsernames({ p1, p2, battleType });
    setIsIntroFinished(false);
    setPhase("INTRO");

    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/github/developer?username=${p1}`),
        fetch(`/api/github/developer?username=${p2}`),
      ]);

      if (!res1.ok || !res2.ok) {
        throw new Error("Could not find one or both GitHub users.");
      }

      const data1 = await res1.json();
      const data2 = await res2.json();

      setGhostBattleData({ p1: data1, p2: data2, battleType });
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate battle.");
      setPhase("SETUP");
    }
  }, []);

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
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card/60 backdrop-blur-md hover:bg-accent text-xs font-medium transition-all shadow-sm active:scale-95"
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
          >
            <BattleSetup onStart={startGhostBattle} />
          </motion.div>
        )}

        {phase === "INTRO" && setupUsernames && !isIntroFinished && (
          <BattleIntro
            key="intro"
            p1Username={setupUsernames.p1}
            p2Username={setupUsernames.p2}
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
              onComplete={() => setPhase("REPORT")}
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
              onToggleMute={toggleMute}
              onRematch={() => {
                setGhostBattleData(null);
                setSetupUsernames(null);
                setPhase("SETUP");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
