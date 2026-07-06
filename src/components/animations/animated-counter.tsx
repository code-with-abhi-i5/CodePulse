"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "motion/react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const spring = useSpring(0, { 
    stiffness: 50, 
    damping: 20,
    duration: duration * 1000,
  });
  const display = useTransform(spring, (latest) => {
    return decimals > 0 ? latest.toFixed(decimals) : Math.round(latest);
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(typeof latest === "string" ? parseFloat(latest) : latest);
    });
    return unsubscribe;
  }, [display]);

  const formatValue = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 10000) return `${(num / 1000).toFixed(1)}K`;
    if (decimals > 0) return num.toFixed(decimals);
    return Math.round(num).toLocaleString();
  };

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      {prefix}
      {formatValue(displayValue)}
      {suffix}
    </motion.span>
  );
}

// Animated progress bar
interface AnimatedProgressProps {
  value: number;
  max: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AnimatedProgress({
  value,
  max,
  className = "",
  barClassName = "",
  showLabel = false,
  size = "md",
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
      <div
        className={`w-full ${heights[size]} rounded-full bg-white/5 overflow-hidden`}
      >
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 ${barClassName}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            type: "spring",
            stiffness: 50,
            damping: 15,
            delay: 0.2,
          }}
        />
      </div>
    </div>
  );
}

// Animated ring/circle progress
interface AnimatedRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedRing({
  value,
  max,
  size = 80,
  strokeWidth = 6,
  className = "",
  children,
}: AnimatedRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(1 0 0 / 5%)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            type: "spring",
            stiffness: 40,
            damping: 15,
            delay: 0.3,
          }}
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.65 0.25 280)" />
            <stop offset="100%" stopColor="oklch(0.62 0.2 250)" />
          </linearGradient>
        </defs>
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
