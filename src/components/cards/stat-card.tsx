"use client";

import type { ElementType } from "react";
import { type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/animations/animated-counter";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ===========================
// Types
// ===========================

type StatColor = "purple" | "blue" | "emerald" | "orange";

interface StatCardProps {
  id?: string;
  title: string;
  value: number;
  change?: number;
  icon: ElementType;
  color?: StatColor;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

// ===========================
// Gradient Maps
// ===========================

const ICON_GRADIENTS: Record<StatColor, string> = {
  purple: "from-purple-500 to-violet-600",
  blue: "from-blue-500 to-indigo-600",
  emerald: "from-emerald-500 to-teal-600",
  orange: "from-orange-500 to-amber-600",
};

const ICON_GLOW: Record<StatColor, string> = {
  purple: "shadow-purple-500/25",
  blue: "shadow-blue-500/25",
  emerald: "shadow-emerald-500/25",
  orange: "shadow-orange-500/25",
};

// ===========================
// Component
// ===========================

export function StatCard({
  id,
  title,
  value,
  change = 0,
  icon: Icon,
  color = "purple",
  suffix,
  prefix,
  decimals = 0,
  className,
}: StatCardProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  return (
    <motion.div
      id={id}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative overflow-hidden rounded-[20px]",
        "bg-[#111827]/80 backdrop-blur-xl",
        "border border-white/[0.06]",
        "p-6",
        "shadow-lg shadow-black/20",
        "hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/30",
        "transition-colors duration-300",
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          "bg-gradient-to-br",
          ICON_GRADIENTS[color],
          "mix-blend-soft-light"
        )}
        style={{ opacity: 0 }}
      />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 bg-gradient-to-br from-white to-transparent" />

      <div className="relative z-10 flex items-start justify-between">
        {/* Left content */}
        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium text-slate-400 tracking-wide">
            {title}
          </p>

          <div className="flex items-baseline gap-1.5">
            <AnimatedCounter
              value={value}
              prefix={prefix}
              suffix={suffix ? ` ${suffix}` : undefined}
              decimals={decimals}
              className="text-3xl font-bold text-white tracking-tight"
            />
          </div>

          {/* Trend indicator */}
          <div className="flex items-center gap-1.5">
            {isPositive && (
              <>
                <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">
                    +{Math.abs(change)}%
                  </span>
                </div>
                <span className="text-xs text-slate-500">vs last month</span>
              </>
            )}
            {isNegative && (
              <>
                <div className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5">
                  <TrendingDown className="h-3 w-3 text-red-400" />
                  <span className="text-xs font-semibold text-red-400">
                    {change}%
                  </span>
                </div>
                <span className="text-xs text-slate-500">vs last month</span>
              </>
            )}
            {isNeutral && (
              <div className="flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5">
                <Minus className="h-3 w-3 text-slate-400" />
                <span className="text-xs font-medium text-slate-400">
                  No change
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Icon */}
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            "bg-gradient-to-br shadow-lg",
            ICON_GRADIENTS[color],
            ICON_GLOW[color]
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
