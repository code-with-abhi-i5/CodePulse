"use client";

import { useEffect, useState } from "react";

const DURATION_MS = 2400;

type CountUpProps = {
  target: number;
  suffix: string;
  decimalPlaces?: number;
  isVisible: boolean;
  reducedMotion: boolean;
};

export function CountUp({
  target,
  suffix,
  decimalPlaces = 0,
  isVisible,
  reducedMotion,
}: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frameId = 0;
    if (reducedMotion) {
      frameId = requestAnimationFrame(() => setCount(target));
      return () => cancelAnimationFrame(frameId);
    }

    if (!isVisible) return;

    let startTime: number | null = null;
    const precision = 10 ** decimalPlaces;

    const animate = (timestamp: number) => {
      startTime ??= timestamp;
      const progress = Math.min((timestamp - startTime) / DURATION_MS, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      setCount(Math.round(target * easedProgress * precision) / precision);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [decimalPlaces, isVisible, reducedMotion, target]);

  return <>{count.toFixed(decimalPlaces)}{suffix}</>;
}
