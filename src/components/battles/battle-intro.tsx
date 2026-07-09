"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface BattleIntroProps {
  p1Username: string;
  p2Username: string;
  onIntroComplete: () => void;
}

const STEPS = [
  "Loading GitHub Data...",
  "Loading Contributions...",
  "Loading Repositories...",
  "Preparing Battle...",
  "⚔️ Battle Begins",
];

export function BattleIntro({ p1Username, p2Username, onIntroComplete }: BattleIntroProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (stepIndex < STEPS.length - 1) {
      const timer = setTimeout(() => {
        setStepIndex(stepIndex + 1);
      }, 800); // Wait 800ms per text step
      return () => clearTimeout(timer);
    } else {
      // Last step, wait a bit longer then finish intro
      const timer = setTimeout(() => {
        onIntroComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stepIndex, onIntroComplete]);

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
            <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4 overflow-hidden">
               <img src={`https://github.com/${p1Username}.png`} alt={p1Username} className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-lg">@{p1Username}</span>
          </motion.div>

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
            <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4 overflow-hidden">
               <img src={`https://github.com/${p2Username}.png`} alt={p2Username} className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-lg">@{p2Username}</span>
          </motion.div>
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
