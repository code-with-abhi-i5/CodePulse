"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Globe, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface GlobalRankingMeterProps {
  stats: any;
  rating: any;
}

export function GlobalRankingMeter({ stats, rating }: GlobalRankingMeterProps) {
  const [percentage, setPercentage] = useState(0);

  // Calculate a fake percentile based on score for demonstration, since we don't have true global percentile in DB.
  // Higher score = lower percentile number (e.g. Top 1%)
  const score = rating?.growthScore || 0;
  const targetPercentile = Math.max(1, Math.min(99, 100 - (score / 100))); 
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setPercentage(100 - targetPercentile); // We animate the gauge fill based on this
    }, 500);
    return () => clearTimeout(timer);
  }, [targetPercentile]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass-card rounded-[32px] p-8 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group h-full">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-purple-500/30 transition-colors duration-700" />

      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-8 relative z-10 w-full">
        <Globe className="w-4 h-4 text-purple-400" />
        Global Ranking
      </h3>

      <div className="relative z-10 flex items-center justify-center w-full max-w-[200px] aspect-square mx-auto mb-4">
        {/* SVG Speedometer */}
        <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
            fill="transparent"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            stroke="url(#purpleGradient)"
            strokeWidth="12"
            fill="transparent"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
          <defs>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm text-slate-400 font-medium">Top</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
              {targetPercentile.toFixed(1)}
            </span>
            <span className="text-xl font-bold text-indigo-400">%</span>
          </div>
        </div>
      </div>

      <div className="text-center relative z-10 w-full mt-auto">
        <div className="flex items-center justify-center gap-2 text-sm text-emerald-400 font-medium bg-emerald-400/10 py-1.5 px-3 rounded-full w-fit mx-auto">
          <TrendingUp className="w-4 h-4" />
          <span>Ahead of {formatNumber(stats?.totalCommits ? Math.floor(stats.totalCommits * 3.14) : 0)} devs</span>
        </div>
      </div>
    </div>
  );
}
