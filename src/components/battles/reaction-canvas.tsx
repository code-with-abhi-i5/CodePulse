"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Flame, Volume2, VolumeX, Sparkles, Zap } from "lucide-react";

export type SpectatorEmoji = "🔥" | "🚀" | "💡" | "🤯" | "💀";

export const SPECTATOR_EMOJIS: SpectatorEmoji[] = ["🔥", "🚀", "💡", "🤯", "💀"];

export interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  emoji: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  wobblePhase: number;
  rotation: number;
  rotationSpeed: number;
  isBurst: boolean;
}

export interface ReactionCanvasProps {
  battleId: string;
  initialHype?: number; // 0 to 100
  currentHypeIndex?: number; // optional externally controlled hype
  onReact?: (emoji: SpectatorEmoji) => void;
  onHypeBurst?: (battleId: string) => void;
  readOnly?: boolean;
  enableAudio?: boolean;
  showReactionsBar?: boolean;
  className?: string;
  isMobileOverride?: boolean;
  maxParticlesDesktop?: number;
  maxParticlesMobile?: number;
}

export const ReactionCanvas: React.FC<ReactionCanvasProps> = ({
  battleId,
  initialHype = 25,
  currentHypeIndex,
  onReact,
  onHypeBurst,
  readOnly = false,
  enableAudio = true,
  showReactionsBar = true,
  className = "",
  isMobileOverride,
  maxParticlesDesktop = 250,
  maxParticlesMobile = 50,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hypeIndex, setHypeIndex] = useState<number>(currentHypeIndex ?? initialHype);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(!enableAudio);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [activeParticleCount, setActiveParticleCount] = useState<number>(0);

  // In-memory particle list for the 60 FPS animation loop
  const particlesRef = useRef<FloatingParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const hasTriggeredBurstRef = useRef<boolean>(false);

  // Web Audio Context for live audio hype meter
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Detect mobile environment for automatic particle culling
  const isMobile =
    isMobileOverride ??
    (typeof window !== "undefined" &&
      (window.innerWidth < 768 || (navigator && navigator.maxTouchPoints > 1)));

  const effectiveMaxParticles = isMobile ? maxParticlesMobile : maxParticlesDesktop;

  // Sync external hype changes if controlled
  useEffect(() => {
    if (currentHypeIndex !== undefined) {
      setHypeIndex(currentHypeIndex);
    }
  }, [currentHypeIndex]);

  // Audio synthesis helper
  const initAudio = useCallback(() => {
    if (typeof window === "undefined" || isAudioMuted) return null;
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, [isAudioMuted]);

  // Synthesize dynamic hype pitch / crowd tone based on hype level (0 - 100%)
  const playHypeTone = useCallback(
    (hype: number) => {
      const ctx = initAudio();
      if (!ctx || isAudioMuted) return;

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Frequency sweeps from 220Hz (A3) up to 880Hz (A5) with hype index
        const baseFreq = 220 + (hype / 100) * 660;
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

        const volume = Math.min(0.2, (hype / 100) * 0.15 + 0.05);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } catch {
        // Audio synthesis fallback
      }
    },
    [initAudio, isAudioMuted],
  );

  // Synthesize triumphant fanfare chord on 100% hype burst
  const play100PercentFanfare = useCallback(() => {
    const ctx = initAudio();
    if (!ctx || isAudioMuted) return;

    try {
      // C Major power triad: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const frequencies = [523.25, 659.25, 783.99, 1046.5];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);

        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.04);
        osc.stop(ctx.currentTime + 0.85);
      });
    } catch {
      // Audio fallback
    }
  }, [initAudio, isAudioMuted]);

  // Spawns a floating reaction emoji particle
  const spawnReactionParticle = useCallback(
    (emoji: string, originX?: number, originY?: number) => {
      const canvas = canvasRef.current;
      const width = canvas ? canvas.width : 400;
      const height = canvas ? canvas.height : 250;

      const p: FloatingParticle = {
        id: Math.random() + Date.now(),
        x: originX !== undefined ? originX : Math.random() * (width * 0.8) + width * 0.1,
        y: originY !== undefined ? originY : height - 20,
        vx: (Math.random() - 0.5) * 2.0,
        vy: -(Math.random() * 3.5 + 2.5),
        gravity: -0.015, // gentle buoyant rise
        emoji,
        size: Math.floor(Math.random() * 12 + 24),
        alpha: 1.0,
        life: Math.floor(Math.random() * 40 + 70), // ~1.2 - 1.8 seconds
        maxLife: 110,
        wobbleSpeed: 0.05 + Math.random() * 0.05,
        wobbleAmp: 1.5 + Math.random() * 2.0,
        wobblePhase: Math.random() * Math.PI * 2,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        isBurst: false,
      };

      particlesRef.current.push(p);

      // Automatic particle culling if pool exceeds threshold
      if (particlesRef.current.length > effectiveMaxParticles) {
        particlesRef.current.splice(0, particlesRef.current.length - effectiveMaxParticles);
      }
    },
    [effectiveMaxParticles],
  );

  // Spawns fireworks radial explosion of particles when Hype hits 100%
  const trigger100PercentBurst = useCallback(() => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 500;
    const height = canvas ? canvas.height : 300;
    const burstEmojis = ["✨", "💥", "🔥", "⚡", "🚀", "🎉", "🤯"];

    const burstCount = isMobile ? 40 : 90;
    const originX = width / 2;
    const originY = height * 0.5;

    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 4;
      const p: FloatingParticle = {
        id: Math.random() + Date.now() + i,
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        gravity: 0.16, // gravitational pull downward
        emoji: burstEmojis[Math.floor(Math.random() * burstEmojis.length)],
        size: Math.floor(Math.random() * 14 + 26),
        alpha: 1.0,
        life: Math.floor(Math.random() * 50 + 80),
        maxLife: 130,
        wobbleSpeed: 0.03 + Math.random() * 0.04,
        wobbleAmp: 1.0 + Math.random() * 1.5,
        wobblePhase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        isBurst: true,
      };
      particlesRef.current.push(p);
    }

    // Trigger visual screen shake
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 600);

    // Trigger audio fanfare
    play100PercentFanfare();

    if (onHypeBurst) {
      onHypeBurst(battleId);
    }
  }, [battleId, isMobile, onHypeBurst, play100PercentFanfare]);

  // Handle user reaction button tap
  const handleEmojiClick = (emoji: SpectatorEmoji, e?: React.MouseEvent) => {
    if (readOnly) return;

    // Calculate click coordinates relative to canvas
    let originX: number | undefined;
    let originY: number | undefined;
    if (e && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      originX = e.clientX - rect.left;
      originY = rect.height - 20;
    }

    // Spawn 2-4 instant burst particles for tactile feel
    const burstQuantity = isMobile ? 2 : 4;
    for (let i = 0; i < burstQuantity; i++) {
      spawnReactionParticle(
        emoji,
        originX ? originX + (Math.random() - 0.5) * 40 : undefined,
        originY,
      );
    }

    // Increase local hype index optimistically
    setHypeIndex((prev) => {
      const nextHype = Math.min(100, prev + 2);
      playHypeTone(nextHype);
      return nextHype;
    });

    if (onReact) {
      onReact(emoji);
    }
  };

  // Keyboard accessibility triggers (1=🔥, 2=🚀, 3=💡, 4=🤯, 5=💀)
  useEffect(() => {
    if (readOnly) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const keyMap: Record<string, SpectatorEmoji> = {
        "1": "🔥",
        "2": "🚀",
        "3": "💡",
        "4": "🤯",
        "5": "💀",
      };
      if (keyMap[e.key]) {
        handleEmojiClick(keyMap[e.key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readOnly, handleEmojiClick]);

  // 100% Hype detection
  useEffect(() => {
    if (hypeIndex >= 100) {
      if (!hasTriggeredBurstRef.current) {
        hasTriggeredBurstRef.current = true;
        trigger100PercentBurst();
      }
    } else if (hypeIndex < 85) {
      hasTriggeredBurstRef.current = false;
    }
  }, [hypeIndex, trigger100PercentBurst]);

  // 60 FPS HTML5 Canvas Animation & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    // Handle high-DPI retina canvas scaling
    const resizeCanvas = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const renderLoop = (timestamp: number) => {
      if (!isRunning) return;

      const frameDelta = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      // Dynamic Frame-Rate Culling:
      // If frame time exceeds 28ms (<36 FPS), immediately cull 30% of lowest-life particles
      if (frameDelta > 28 && particlesRef.current.length > 20) {
        particlesRef.current.splice(0, Math.floor(particlesRef.current.length * 0.3));
      }

      const rect = containerRef.current?.getBoundingClientRect();
      const width = rect?.width || 400;
      const height = rect?.height || 250;

      ctx.clearRect(0, 0, width, height);

      const survivingParticles: FloatingParticle[] = [];
      const fontCache: Record<number, string> = {};

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.life -= 1;

        if (p.life > 0) {
          // Physics integration
          p.vy += p.gravity;
          p.x += p.vx + Math.sin(p.wobblePhase) * p.wobbleAmp;
          p.y += p.vy;
          p.wobblePhase += p.wobbleSpeed;
          p.rotation += p.rotationSpeed;

          // Render particle
          const currentAlpha = Math.max(0, p.alpha * (p.life / p.maxLife));
          ctx.save();
          ctx.globalAlpha = currentAlpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          if (!fontCache[p.size]) {
            fontCache[p.size] = `${p.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
          }
          ctx.font = fontCache[p.size];
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, 0, 0);
          ctx.restore();

          survivingParticles.push(p);
        }
      }

      particlesRef.current = survivingParticles;
      setActiveParticleCount(survivingParticles.length);

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Determine Hype Color gradient
  const getHypeColor = (val: number) => {
    if (val >= 95) return "from-purple-600 via-pink-600 to-red-500 animate-pulse";
    if (val >= 75) return "from-red-500 via-orange-500 to-amber-400";
    if (val >= 50) return "from-amber-500 to-yellow-400";
    return "from-cyan-500 to-blue-500";
  };

  return (
    <div
      ref={containerRef}
      data-testid="reaction-canvas-container"
      className={`relative w-full overflow-hidden rounded-2xl bg-neutral-950/80 border border-white/10 p-4 transition-transform ${
        isScreenShaking ? "animate-bounce duration-100 ring-2 ring-red-500/50" : ""
      } ${className}`}
    >
      {/* 60 FPS HTML5 Canvas Overlay */}
      <canvas
        ref={canvasRef}
        data-testid="reaction-canvas"
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      />

      {/* Header & Controls */}
      <div className="relative z-20 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame
            className={`w-5 h-5 ${
              hypeIndex >= 90
                ? "text-red-400 animate-spin"
                : hypeIndex >= 50
                ? "text-amber-400 animate-pulse"
                : "text-cyan-400"
            }`}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
            Live Spectator Hype
          </span>
          {hypeIndex >= 95 && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
              <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> Hype Storm Active!
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Hype Synthesizer Toggle */}
          <button
            type="button"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            title={isAudioMuted ? "Unmute Live Audio Hype" : "Mute Live Audio Hype"}
            aria-label={isAudioMuted ? "Unmute Audio" : "Mute Audio"}
            className="p-1 rounded-md text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Hype Meter Metric Display */}
          <div className="flex items-center gap-1 font-mono text-xs">
            <span
              data-testid="hype-value"
              className={`font-black ${
                hypeIndex >= 90 ? "text-red-400 text-sm" : hypeIndex >= 50 ? "text-amber-400" : "text-cyan-400"
              }`}
            >
              {hypeIndex}
            </span>
            <span className="text-white/40">/100</span>
          </div>
        </div>
      </div>

      {/* Live Hype Progress Gauge */}
      <div
        data-testid="hype-meter-gauge"
        role="meter"
        aria-valuenow={hypeIndex}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative z-20 w-full h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden mb-3 p-0.5"
      >
        <div
          style={{ width: `${hypeIndex}%` }}
          className={`h-full rounded-full bg-gradient-to-r ${getHypeColor(
            hypeIndex,
          )} transition-all duration-300 shadow-lg`}
        />
      </div>

      {/* Spectator Emoji Reaction Bar */}
      {showReactionsBar && (
        <div className="relative z-20 flex items-center justify-between gap-2 pt-2 border-t border-white/5">
          {SPECTATOR_EMOJIS.map((emoji, idx) => (
            <button
              key={emoji}
              data-testid={`reaction-btn-${emoji}`}
              type="button"
              disabled={readOnly}
              onClick={(e) => handleEmojiClick(emoji, e)}
              className="group relative flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-lg hover:scale-125 active:scale-95 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400"
              title={`React ${emoji} (Hotkey: ${idx + 1})`}
              aria-label={`React with ${emoji}`}
            >
              <span className="inline-block transition-transform group-hover:animate-bounce">
                {emoji}
              </span>
              <span className="hidden sm:inline-block absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/30 group-hover:text-white/70">
                {idx + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Particle telemetry footer for testing & mobile verification */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-white/30 font-mono">
        <span>Battle: {battleId}</span>
        <span>
          Particles: {activeParticleCount}/{effectiveMaxParticles} ({isMobile ? "Mobile" : "Desktop"})
        </span>
      </div>
    </div>
  );
};
