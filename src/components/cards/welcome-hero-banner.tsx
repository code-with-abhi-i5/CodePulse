"use client";

import { motion } from "motion/react";
import { Sparkles, ArrowRight, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeHeroBannerProps {
  user: any;
  rating: any;
  className?: string;
}

export function WelcomeHeroBanner({ user, rating, className }: WelcomeHeroBannerProps) {
  const firstName = (user?.name || user?.username || "Developer").split(" ")[0];
  const level = rating?.level || 1;
  const xp = rating?.xp || 0;
  const xpToNextLevel = rating?.xpToNextLevel || 100;
  const progressPercent = Math.min(100, Math.max(0, (xp / xpToNextLevel) * 100));

  return (
    <div className={cn("relative overflow-hidden glass-card rounded-[32px] p-8 md:p-10 border border-white/5 group", className)}>
      {/* Background Animated Gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/30 transition-colors duration-1000" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-1000" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-purple-300">
              <Sparkles className="w-3.5 h-3.5" />
              DevBattle Command Center
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight"
          >
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{firstName}</span>.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 text-lg text-slate-400"
          >
            Your current rank is <strong className="text-white">{rating?.tier || 'BRONZE'}</strong>. 
            Keep coding, reviewing, and crushing challenges to climb the global leaderboard.
          </motion.p>
        </div>

        {/* Level Progress Widget */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full md:w-72 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-bold text-white text-sm">Level {level}</span>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {xp} / {xpToNextLevel} XP
            </span>
          </div>
          
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
            </motion.div>
          </div>
          
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> {xpToNextLevel - xp} XP to level up
            </span>
            <button className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors">
              View details <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
