"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { Swords, Star, GitCommit, GitPullRequest, Users, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface DevData {
  username: string;
  name: string;
  avatar: string;
  stats: {
    totalCommits: number;
    totalPRs: number;
    totalStars: number;
    followers: number;
    streak: number;
  };
}

interface BattleArenaProps {
  player1: DevData;
  player2: DevData;
  onReset: () => void;
}

const calculatePower = (stats: DevData['stats']) => {
  return (
    (stats.totalCommits * 1) +
    (stats.totalPRs * 5) +
    (stats.totalStars * 10) +
    (stats.followers * 2) +
    (stats.streak * 5)
  );
};

export function BattleArena({ player1, player2, onReset }: BattleArenaProps) {
  const [phase, setPhase] = useState<"vs" | "stats" | "result">("vs");
  
  const p1Power = calculatePower(player1.stats);
  const p2Power = calculatePower(player2.stats);
  const totalPower = p1Power + p2Power || 1; // avoid div by 0

  const p1Wins = p1Power >= p2Power;
  const p2Wins = p2Power > p1Power;

  // Animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("stats"), 2500); // VS screen for 2.5s
    const timer2 = setTimeout(() => setPhase("result"), 7000); // Show results after 7s total
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Bar - Power Meter (Visible during stats and result) */}
      <AnimatePresence>
        {phase !== "vs" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 rounded-[20px] flex items-center justify-between gap-4"
          >
            <div className="text-xl font-bold text-purple-400 w-24 text-center">
              <AnimatedCounter value={p1Power} />
            </div>
            
            <div className="flex-1 h-4 rounded-full bg-black/50 overflow-hidden flex relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md z-10">
                  <Swords className="w-4 h-4 text-white/50" />
                </div>
              </div>
              <motion.div
                initial={{ width: "50%" }}
                animate={{ width: `${(p1Power / totalPower) * 100}%` }}
                transition={{ type: "spring", stiffness: 40, damping: 20, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 relative"
              >
                 <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/30 to-transparent" />
              </motion.div>
              <motion.div
                initial={{ width: "50%" }}
                animate={{ width: `${(p2Power / totalPower) * 100}%` }}
                transition={{ type: "spring", stiffness: 40, damping: 20, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 relative"
              >
                 <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/30 to-transparent" />
              </motion.div>
            </div>
            
            <div className="text-xl font-bold text-emerald-400 w-24 text-center">
              <AnimatedCounter value={p2Power} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center min-h-[400px]">
        {/* Player 1 Card */}
        <FighterCard 
          data={player1} 
          isWinner={phase === "result" && p1Wins}
          isLoser={phase === "result" && !p1Wins}
          phase={phase}
          align="right"
        />

        {/* Center Divider / VS */}
        <div className="flex flex-col items-center justify-center">
          {phase === "vs" ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/30 flex items-center justify-center animate-pulse"
            >
              <span className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-orange-500">VS</span>
            </motion.div>
          ) : (
            <div className="w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          )}
        </div>

        {/* Player 2 Card */}
        <FighterCard 
          data={player2} 
          isWinner={phase === "result" && p2Wins}
          isLoser={phase === "result" && !p2Wins}
          phase={phase}
          align="left"
        />
      </div>

      {/* Action Buttons */}
      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center pt-8"
          >
            <button
              onClick={onReset}
              className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
            >
              Battle Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FighterCard({ 
  data, 
  isWinner, 
  isLoser, 
  phase,
  align 
}: { 
  data: DevData; 
  isWinner: boolean; 
  isLoser: boolean; 
  phase: string;
  align: "left" | "right";
}) {
  return (
    <motion.div
      initial={{ x: align === "right" ? -50 : 50, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: isLoser ? 0.5 : 1,
        scale: isWinner ? 1.05 : isLoser ? 0.95 : 1,
        filter: isLoser ? 'grayscale(0.8)' : 'grayscale(0)'
      }}
      transition={{ duration: 0.5, type: "spring" }}
      className={cn(
        "glass-card rounded-[32px] p-8 relative overflow-hidden",
        isWinner && "ring-2 ring-amber-400/50 shadow-[0_0_50px_rgba(251,191,36,0.15)]"
      )}
    >
      {/* Winner Stamp */}
      <AnimatePresence>
        {isWinner && (
          <motion.div
            initial={{ scale: 3, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: -15 }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
          >
            <div className="border-4 border-amber-400 text-amber-400 text-5xl font-black px-6 py-2 rounded-xl backdrop-blur-sm bg-black/20 shadow-2xl">
              WINNER
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("flex flex-col items-center", align === "right" ? "md:items-end" : "md:items-start")}>
        <img 
          src={data.avatar} 
          alt={data.name} 
          className="w-32 h-32 rounded-3xl border-4 border-white/10 shadow-2xl mb-4" 
        />
        <h3 className="text-2xl font-bold text-white">{data.name}</h3>
        <p className="text-muted-foreground">@{data.username}</p>
      </div>

      <AnimatePresence>
        {phase !== "vs" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 0.2 }}
            className="mt-8 space-y-4"
          >
            <StatRow icon={GitCommit} label="Commits" value={data.stats.totalCommits} delay={0.5} />
            <StatRow icon={GitPullRequest} label="Pull Requests" value={data.stats.totalPRs} delay={1.0} />
            <StatRow icon={Star} label="Stars Earned" value={data.stats.totalStars} delay={1.5} />
            <StatRow icon={Users} label="Followers" value={data.stats.followers} delay={2.0} />
            <StatRow icon={Flame} label="Current Streak" value={data.stats.streak} delay={2.5} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatRow({ icon: Icon, label, value, delay }: { icon: any, label: string, value: number, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center justify-between bg-black/20 rounded-xl p-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-gray-300">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">
        <AnimatedCounter value={value} />
      </div>
    </motion.div>
  );
}
