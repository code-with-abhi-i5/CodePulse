"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { BattleSetup } from "@/components/battles/battle-setup";
import { BattleIntro } from "@/components/battles/battle-intro";
import { BattleRounds } from "@/components/battles/battle-rounds";
import { BattleReport } from "@/components/battles/battle-report";

type BattlePhase = "SETUP" | "INTRO" | "ROUNDS" | "REPORT";

export default function BattlesPage() {
  const [phase, setPhase] = useState<BattlePhase>("SETUP");
  const [ghostBattleData, setGhostBattleData] = useState<{ p1: any, p2: any, battleType: string } | null>(null);
  const [setupUsernames, setSetupUsernames] = useState<{p1: string, p2: string, battleType: string} | null>(null);

  const startGhostBattle = async (p1: string, p2: string, battleType: string) => {
    setSetupUsernames({ p1, p2, battleType });
    setPhase("INTRO");
    
    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/github/developer?username=${p1}`),
        fetch(`/api/github/developer?username=${p2}`)
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
  };

  const handleIntroComplete = () => {
    if (ghostBattleData) {
      setPhase("ROUNDS");
    } else {
      // Data hasn't loaded yet, just wait silently.
      setTimeout(handleIntroComplete, 500);
    }
  };

  return (
    <div className="w-full relative min-h-[calc(100vh-80px)]">
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

        {phase === "INTRO" && setupUsernames && (
          <BattleIntro 
            key="intro"
            p1Username={setupUsernames.p1}
            p2Username={setupUsernames.p2}
            onIntroComplete={handleIntroComplete}
          />
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

