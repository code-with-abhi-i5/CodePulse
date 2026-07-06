"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { ContributionDay } from "@/types";
import { Flame } from "lucide-react";
import { motion } from "motion/react";

interface ContributionHeatmapProps {
  className?: string;
  data?: ContributionDay[];
}

// Glowing custom colors for the new grid
const LEVEL_COLORS = {
  0: "bg-white/5 border-white/5",
  1: "bg-purple-900/40 border-purple-800/50",
  2: "bg-purple-700/60 border-purple-600/50 shadow-[0_0_8px_rgba(126,34,206,0.3)]",
  3: "bg-fuchsia-500/80 border-fuchsia-400/50 shadow-[0_0_12px_rgba(217,70,239,0.5)]",
  4: "bg-pink-400 border-pink-300 shadow-[0_0_16px_rgba(244,114,182,0.8)]",
};

export function ContributionHeatmap({ className, data = [] }: ContributionHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);

  // We only want to show the last 24 weeks (approx 6 months) to make the grid look dense and premium
  const gridData = useMemo(() => {
    const WEEKS_TO_SHOW = 24;
    const TOTAL_DAYS = WEEKS_TO_SHOW * 7;
    
    // Sort data chronologically (assuming it's given as an array)
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Get only the most recent days to fit our grid
    const recentData = sorted.slice(-TOTAL_DAYS);
    
    // If we don't have enough data, pad it at the beginning with 0 counts
    if (recentData.length < TOTAL_DAYS) {
      const paddingNeeded = TOTAL_DAYS - recentData.length;
      const firstDate = recentData.length > 0 ? new Date(recentData[0].date) : new Date();
      
      const paddedDays = [];
      for (let i = paddingNeeded; i > 0; i--) {
        const d = new Date(firstDate);
        d.setDate(d.getDate() - i);
        paddedDays.push({ date: d.toISOString().split('T')[0], count: 0, level: 0 } as ContributionDay);
      }
      return [...paddedDays, ...recentData];
    }
    
    return recentData;
  }, [data]);

  // Restructure into weeks (arrays of 7 days) for columns
  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < gridData.length; i += 7) {
      w.push(gridData.slice(i, i + 7));
    }
    return w;
  }, [gridData]);

  // Helper to determine intensity level (0-4) based on counts
  const getLevel = (count: number) => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
  };

  return (
    <div className={cn("glass-card rounded-[32px] border border-white/5 p-8 relative overflow-hidden group h-full flex flex-col", className)}>
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-fuchsia-500/20 transition-colors duration-1000" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/20">
              <Flame className="w-5 h-5 text-fuchsia-400" />
            </div>
            Activity Grid
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            Your contribution density over the last 6 months.
          </p>
        </div>
        
        {/* Dynamic Tooltip Area */}
        <div className="hidden sm:flex flex-col items-end min-h-[48px] justify-center">
          {hoveredDay ? (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="text-right"
            >
              <div className="text-fuchsia-400 font-bold text-lg leading-none">
                {hoveredDay.count} {hoveredDay.count === 1 ? 'contribution' : 'contributions'}
              </div>
              <div className="text-slate-400 text-xs mt-1">
                {new Date(hoveredDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </motion.div>
          ) : (
            <div className="text-slate-500 text-sm italic">Hover over the grid</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 overflow-x-auto pb-4">
        {/* The Grid */}
        <div className="flex gap-1.5 md:gap-2">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5 md:gap-2">
              {week.map((day, dIdx) => {
                const level = getLevel(day.count) as keyof typeof LEVEL_COLORS;
                return (
                  <motion.div
                    key={`${wIdx}-${dIdx}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (wIdx * 0.02) + (dIdx * 0.01), duration: 0.3 }}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={cn(
                      "w-3 h-3 md:w-4 md:h-4 rounded-sm border cursor-pointer transition-all duration-300",
                      LEVEL_COLORS[level],
                      hoveredDay?.date === day.date ? "scale-125 z-10 border-white ring-2 ring-fuchsia-500/50" : "hover:scale-110"
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs font-medium text-slate-500 relative z-10">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={cn("w-3 h-3 rounded-sm border", LEVEL_COLORS[l as keyof typeof LEVEL_COLORS])} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
