"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Bot, Crown } from "lucide-react";

interface BattleIntroProps {
  p1Username: string;
  p2Username: string;
  selectedBot?: { name: string; avatar: string; banter: string[]; difficulty: string; color: string } | null;
  isBotBattle?: boolean;
  onIntroComplete: () => void;
}

const STEPS = [
  "Loading GitHub Data...",
  "Loading Contributions...",
  "Loading Repositories...",
  "Preparing Battle...",
  "⚔️ Battle Begins",
];

export function BattleIntro({ p1Username, p2Username, selectedBot, isBotBattle = false, onIntroComplete }: BattleIntroProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (stepIndex < STEPS.length - 1) {
      const timer = setTimeout(() => {
        setStepIndex(stepIndex + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        onIntroComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stepIndex, onIntroComplete]);

  const trashTalk = selectedBot?.banter?.[stepIndex % selectedBot.banter.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-12 mb-12">
          {/* Avatar placeholders or actual avatars if fetched already, but since they might be fetching, we show usernames or placeholder avatars */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4 overflow-hidden relative">
               <Skeleton className="absolute inset-0 rounded-2xl" />
               <img src={`https://github.com/${p1Username}.png`} alt={p1Username} className="w-full h-full object-cover relative z-10" />
            </div>
            <span className="font-semibold text-lg">@{p1Username}</span>
          </motion.div>

          {isBotBattle && selectedBot ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mb-2 overflow-hidden relative shadow-xl">
                   <img src={selectedBot.avatar} alt={selectedBot.name} className="w-full h-full object-cover relative z-10" />
                   <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center border-4 border-background shadow-lg text-black">
                     <Crown className="w-4 h-4 fill-current" />
                   </div>
                </div>
                <span className="font-semibold text-lg">{selectedBot.name}</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${selectedBot.color}`}>
                  {selectedBot.difficulty.charAt(0).toUpperCase() + selectedBot.difficulty.slice(1)}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-center gap-1"
              >
                <Bot className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm italic text-muted-foreground">&quot;{trashTalk}&quot;</span>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-4xl font-black italic text-muted-foreground"
              >
                VS
              </motion.div>

              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4 overflow-hidden relative">
                   <Skeleton className="absolute inset-0 rounded-2xl" />
                   <img src={`https://github.com/${p2Username}.png`} alt={p2Username} className="w-full h-full object-cover relative z-10" />
                </div>
                <span className="font-semibold text-lg">@{p2Username}</span>
              </motion.div>
            </>
          )}
        </div>

        <div className="h-8 relative overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "text-lg font-medium tracking-wide",
                stepIndex === STEPS.length - 1 ? "text-primary text-2xl font-bold" : "text-muted-foreground"
              )}
            >
              {STEPS[stepIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Progress Bar */}
        <div className="w-64 h-1 bg-muted rounded-full mx-auto mt-6 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            className="h-full bg-primary"
          />
        </div>
      </div>
    </motion.div>
  );
}
