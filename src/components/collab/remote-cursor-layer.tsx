"use client";

import React, { useMemo } from "react";

export interface RemotePointerEvent {
  peerId: string;
  peerName: string;
  xNormalized: number; // [0..1]
  yNormalized: number; // [0..1]
  timestampMs: number;
  clicked?: boolean;
  color?: string;
}

export interface PrivacyBlurRegion {
  id: string;
  label: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

export interface RemoteCursorLayerProps {
  pointers: RemotePointerEvent[];
  blurRegions?: PrivacyBlurRegion[];
  trailWindowMs?: number;
  nowMs?: number;
  onPeerClick?: (event: RemotePointerEvent) => void;
}

export function computeVisualLatencyMs(
  eventTimestampMs: number,
  currentTimeMs: number,
): number {
  return Math.max(0, Math.round(currentTimeMs - eventTimestampMs));
}

export const RemoteCursorLayer: React.FC<RemoteCursorLayerProps> = ({
  pointers,
  blurRegions = [],
  trailWindowMs = 650,
  nowMs,
  onPeerClick,
}) => {
  const effectiveNow = nowMs ?? (pointers.length > 0 ? Math.max(...pointers.map((p) => p.timestampMs)) + 12 : 0);

  const visiblePointers = useMemo(
    () =>
      pointers.filter(
        (pt) => effectiveNow - pt.timestampMs <= trailWindowMs,
      ),
    [pointers, effectiveNow, trailWindowMs],
  );

  return (
    <div
      data-testid="remote-cursor-layer"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Privacy Shield Blur Regions */}
      {blurRegions.map((region) => (
        <div
          key={region.id}
          data-testid={`privacy-blur-region-${region.id}`}
          style={{
            left: `${region.xPct}%`,
            top: `${region.yPct}%`,
            width: `${region.widthPct}%`,
            height: `${region.heightPct}%`,
            backdropFilter: "blur(14px)",
          }}
          className="absolute rounded-lg border border-amber-400/50 bg-zinc-950/55 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-amber-200"
        >
          {region.label}
        </div>
      ))}

      {/* Temporary SVG Laser Pointer Trails & Click Ripples */}
      <svg
        data-testid="laser-trail-svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        {visiblePointers.map((pt) => {
          const cx = Math.max(0, Math.min(1000, pt.xNormalized * 1000));
          const cy = Math.max(0, Math.min(1000, pt.yNormalized * 1000));
          const stroke = pt.color ?? "#38BDF8";
          const ageMs = Math.max(0, effectiveNow - pt.timestampMs);
          const opacity = Math.max(0.15, 1 - ageMs / trailWindowMs);

          return (
            <g key={`${pt.peerId}-${pt.timestampMs}`}>
              <line
                x1={Math.max(0, cx - 36)}
                y1={Math.max(0, cy - 24)}
                x2={cx}
                y2={cy}
                stroke={stroke}
                strokeWidth="4"
                strokeLinecap="round"
                opacity={opacity * 0.75}
              />
              {pt.clicked && (
                <circle
                  data-testid={`click-ripple-${pt.peerId}`}
                  cx={cx}
                  cy={cy}
                  r="22"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="3"
                  opacity={opacity}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Remote Peer Cursors */}
      {visiblePointers.map((pt) => {
        const latencyMs = computeVisualLatencyMs(pt.timestampMs, effectiveNow);
        const isSub40Ms = latencyMs < 40;

        return (
          <div
            key={`cursor-${pt.peerId}-${pt.timestampMs}`}
            data-testid={`remote-cursor-${pt.peerId}`}
            data-latency-ms={latencyMs}
            data-sub-40ms={String(isSub40Ms)}
            onClick={() => onPeerClick?.(pt)}
            style={{
              left: `${Math.max(0, Math.min(98, pt.xNormalized * 100))}%`,
              top: `${Math.max(0, Math.min(98, pt.yNormalized * 100))}%`,
            }}
            className="pointer-events-auto absolute -translate-x-1 -translate-y-1 flex items-center gap-1"
          >
            <span
              style={{ backgroundColor: pt.color ?? "#38BDF8" }}
              className="h-3 w-3 rounded-full ring-2 ring-white shadow"
            />
            <span className="rounded bg-zinc-900/90 px-1.5 py-0.5 text-[10px] font-mono text-white">
              {pt.peerName} ({latencyMs}ms)
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RemoteCursorLayer;
