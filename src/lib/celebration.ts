import confetti from "canvas-confetti";

/**
 * Fires a dynamic dual-cannon victory confetti celebration.
 * Optimized with requestAnimationFrame for smooth 60fps animation.
 */
export function triggerDualCannonConfetti() {
  if (typeof window === "undefined") return;

  const colors = ["#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

  // 1. Immediate initial burst from center
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { y: 0.6 },
    colors,
    zIndex: 9999,
    disableForReducedMotion: true,
  });

  // 2. Dual-cannon continuous celebration (left & right)
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;

  const frame = () => {
    // Left cannon shooting upward and right
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.75 },
      colors,
      zIndex: 9999,
      disableForReducedMotion: true,
    });

    // Right cannon shooting upward and left
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.75 },
      colors,
      zIndex: 9999,
      disableForReducedMotion: true,
    });

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  };

  requestAnimationFrame(frame);
}

/**
 * Synthesizes a subtle, celebratory victory chime using the Web Audio API.
 * Requires zero external audio assets, works completely offline, and respects mute state.
 */
export function playVictorySound(isMuted: boolean = false) {
  if (isMuted || typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // Harmonious major arpeggio: G4 -> C5 -> E5 -> G5
    const notes = [
      { freq: 392.0, start: 0, duration: 0.12 },
      { freq: 523.25, start: 0.11, duration: 0.12 },
      { freq: 659.25, start: 0.22, duration: 0.15 },
      { freq: 783.99, start: 0.36, duration: 0.45 },
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
    masterGain.connect(ctx.destination);

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      noteGain.gain.setValueAtTime(0, ctx.currentTime + start);
      noteGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + duration
      );

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    });
  } catch {
    // Autoplay or AudioContext restriction handled gracefully
  }
}

