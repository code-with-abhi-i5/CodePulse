"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// ===========================
// Skeleton Loaders
// ===========================

export function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-[20px] p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 bg-white/5" />
          <Skeleton className="h-8 w-32 bg-white/5" />
          <Skeleton className="h-3 w-20 bg-white/5" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-[20px] p-6", className)}>
      <Skeleton className="h-5 w-40 mb-4 bg-white/5" />
      <Skeleton className="h-[300px] w-full rounded-xl bg-white/5" />
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-[20px] p-6", className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-white/5" />
          <Skeleton className="h-3 w-24 bg-white/5" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded bg-white/5 mb-3" />
      <Skeleton className="h-3 w-3/4 bg-white/5" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card rounded-[20px] p-6 space-y-3">
      <Skeleton className="h-5 w-40 mb-4 bg-white/5" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
          <Skeleton className="h-4 flex-1 bg-white/5" />
          <Skeleton className="h-4 w-16 bg-white/5" />
        </div>
      ))}
    </div>
  );
}

// ===========================
// Empty States
// ===========================

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "glass-card rounded-[20px] p-12 flex flex-col items-center justify-center text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      {action}
    </motion.div>
  );
}

// ===========================
// Error States
// ===========================

interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  retry,
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "glass-card rounded-[20px] p-12 flex flex-col items-center justify-center text-center border border-red-500/10",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2 text-red-400">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
}

// ===========================
// Loading Spinner
// ===========================

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <motion.div
        className="w-8 h-8 rounded-full border-2 border-white/10 border-t-primary"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// ===========================
// Page Loading
// ===========================

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-white/10 border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </motion.div>
    </div>
  );
}
