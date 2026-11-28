"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export type ConfettiCannonMode =
  | "dual-cannon"
  | "center-burst"
  | "fireworks"
  | "shower"
  | "star-blast";

export interface ConfettiCannonOptions {
  mode?: ConfettiCannonMode;
  durationMs?: number;
  colors?: string[];
  particleCount?: number;
  spread?: number;
  respectReducedMotion?: boolean;
}

export const CONFETTI_PALETTES = {
  vibrant: [
    "#6366F1", // Indigo
    "#A855F7", // Purple
    "#EC4899", // Pink
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#3B82F6", // Blue
  ],
  emerald: ["#10B981", "#34D399", "#059669", "#6EE7B7", "#F59E0B"],
  diamond: ["#38BDF8", "#818CF8", "#C084FC", "#F472B6", "#E0E7FF"],
  gold: ["#F59E0B", "#FBBF24", "#FCD34D", "#D97706", "#FEF3C7"],
};

/**
 * Fires confetti programmatically using canvas-confetti with mobile-adaptive
 * particle counts and respect for prefers-reduced-motion.
 */
export function fireConfettiCannon(options: ConfettiCannonOptions = {}) {
  if (typeof window === "undefined") return;

  const {
    mode = "dual-cannon",
    durationMs = 2500,
    colors = CONFETTI_PALETTES.vibrant,
    particleCount,
    respectReducedMotion = true,
  } = options;

  // Check prefers-reduced-motion
  if (
    respectReducedMotion &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  // Adaptive particle count for responsive viewports (reduce by 40% on mobile)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const countFactor = isMobile ? 0.6 : 1.0;

  try {
    switch (mode) {
      case "center-burst": {
        const baseCount = particleCount ?? 60;
        confetti({
          particleCount: Math.round(baseCount * countFactor),
          spread: 80,
          origin: { x: 0.5, y: 0.6 },
          colors,
          zIndex: 9999,
          disableForReducedMotion: respectReducedMotion,
        });
        break;
      }

      case "star-blast": {
        const baseCount = particleCount ?? 45;
        confetti({
          particleCount: Math.round(baseCount * countFactor),
          spread: 360,
          ticks: 75,
          gravity: 0.6,
          decay: 0.94,
          startVelocity: 30,
          colors: options.colors ?? CONFETTI_PALETTES.gold,
          shapes: ["star"],
          origin: { x: 0.5, y: 0.45 },
          zIndex: 9999,
          disableForReducedMotion: respectReducedMotion,
        });
        break;
      }

      case "shower": {
        const baseCount = particleCount ?? 40;
        confetti({
          particleCount: Math.round(baseCount * countFactor),
          angle: 90,
          spread: 120,
          origin: { x: 0.5, y: 0 },
          gravity: 1.1,
          colors,
          zIndex: 9999,
          disableForReducedMotion: respectReducedMotion,
        });
        break;
      }

      case "fireworks": {
        const end = Date.now() + durationMs;
        const baseCount = particleCount ?? 20;

        const interval: NodeJS.Timeout = setInterval(() => {
          if (Date.now() > end) {
            return clearInterval(interval);
          }
          confetti({
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            origin: {
              x: Math.random(),
              y: Math.random() * 0.4 + 0.1,
            },
            colors,
            zIndex: 9999,
            particleCount: Math.round(baseCount * countFactor),
            disableForReducedMotion: respectReducedMotion,
          });
        }, 300);
        break;
      }

      case "dual-cannon":
      default: {
        // Initial center burst
        confetti({
          particleCount: Math.round((particleCount ?? 35) * countFactor),
          spread: 70,
          origin: { y: 0.65 },
          colors,
          zIndex: 9999,
          disableForReducedMotion: respectReducedMotion,
        });

        const animationEnd = Date.now() + durationMs;
        const continuousCount = Math.max(
          1,
          Math.round(3 * (isMobile ? 0.7 : 1))
        );

        const frame = () => {
          // Left cannon shooting upward and to the right
          confetti({
            particleCount: continuousCount,
            angle: 60,
            spread: 55,
            origin: { x: 0.02, y: 0.75 },
            colors,
            zIndex: 9999,
            disableForReducedMotion: respectReducedMotion,
          });

          // Right cannon shooting upward and to the left
          confetti({
            particleCount: continuousCount,
            angle: 120,
            spread: 55,
            origin: { x: 0.98, y: 0.75 },
            colors,
            zIndex: 9999,
            disableForReducedMotion: respectReducedMotion,
          });

          if (Date.now() < animationEnd) {
            requestAnimationFrame(frame);
          }
        };

        requestAnimationFrame(frame);
        break;
      }
    }
  } catch {
    // Graceful fallback if canvas is unsupported
  }
}

export interface ConfettiCannonProps {
  /** If provided, fires whenever this flips to true or on value change */
  fire?: boolean;
  /** Cannon preset firing mode */
  mode?: ConfettiCannonMode;
  /** Active firing duration in milliseconds */
  durationMs?: number;
  /** Custom particle colors */
  colors?: string[];
  /** Particle density */
  particleCount?: number;
  /** Whether to respect prefers-reduced-motion user media setting */
  respectReducedMotion?: boolean;
  /** Trigger wrapper child elements */
  children?: React.ReactNode;
  /** Callback fired upon completion of the burst duration */
  onComplete?: () => void;
  /** Wrapper class styling */
  className?: string;
  /** Accessible label for button trigger */
  ariaLabel?: string;
  /** Disable button trigger */
  disabled?: boolean;
}

export function ConfettiCannon({
  fire = false,
  mode = "dual-cannon",
  durationMs = 2500,
  colors = CONFETTI_PALETTES.vibrant,
  particleCount,
  respectReducedMotion = true,
  children,
  onComplete,
  className,
  ariaLabel = "Celebrate",
  disabled = false,
}: ConfettiCannonProps) {
  const [isFiring, setIsFiring] = React.useState(false);
  const prevFireRef = React.useRef(fire);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerCannon = React.useCallback(() => {
    if (isFiring || disabled) return;

    setIsFiring(true);
    fireConfettiCannon({
      mode,
      durationMs,
      colors,
      particleCount,
      respectReducedMotion,
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsFiring(false);
      onComplete?.();
    }, durationMs);
  }, [
    isFiring,
    disabled,
    mode,
    durationMs,
    colors,
    particleCount,
    respectReducedMotion,
    onComplete,
  ]);

  // Trigger when fire prop toggles to true
  React.useEffect(() => {
    if (fire && !prevFireRef.current) {
      triggerCannon();
    }
    prevFireRef.current = fire;
  }, [fire, triggerCannon]);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // If custom children provided, wrap them as an interactive click trigger
  if (children) {
    return (
      <div
        data-slot="confetti-cannon-wrapper"
        onClick={triggerCannon}
        className={cn(
          "inline-flex cursor-pointer transition-transform active:scale-95",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            triggerCannon();
          }
        }}
      >
        {children}
      </div>
    );
  }

  // Default accessible celebratory action button
  return (
    <button
      type="button"
      data-slot="confetti-cannon-button"
      onClick={triggerCannon}
      disabled={disabled || isFiring}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl",
        "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25",
        "dark:bg-primary/20 dark:hover:bg-primary/30 dark:text-primary-foreground dark:border-primary/35",
        "shadow-sm transition-all duration-150 active:scale-95 cursor-pointer",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
    >
      <Sparkles
        className={cn(
          "size-4 transition-transform",
          isFiring && "animate-spin text-amber-500"
        )}
      />
      <span>{isFiring ? "Celebrating!" : "Celebrate"}</span>
    </button>
  );
}

export default ConfettiCannon;
