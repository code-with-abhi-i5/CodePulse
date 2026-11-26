"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Monitor,
  MonitorOff,
  Mic,
  MicOff,
  ShieldAlert,
  EyeOff,
  Eye,
  Gauge,
} from "lucide-react";
import {
  PrivacyBlurRegion,
  RemoteCursorLayer,
  RemotePointerEvent,
} from "./remote-cursor-layer";

export type VideoCodecPreference = "VP9" | "AV1";

export interface StreamQualityProfile {
  label: "1080p30" | "720p30" | "480p15";
  width: number;
  height: number;
  frameRate: number;
  maxBitrateBps: number;
}

export function selectAdaptiveQualityProfile(
  availableKbps: number,
): StreamQualityProfile {
  if (availableKbps >= 2500) {
    return {
      label: "1080p30",
      width: 1920,
      height: 1080,
      frameRate: 30,
      maxBitrateBps: 3_500_000,
    };
  }
  if (availableKbps >= 1000) {
    return {
      label: "720p30",
      width: 1280,
      height: 720,
      frameRate: 30,
      maxBitrateBps: 1_400_000,
    };
  }
  return {
    label: "480p15",
    width: 854,
    height: 480,
    frameRate: 15,
    maxBitrateBps: 500_000,
  };
}

export interface ScreenShareDebugProps {
  roomId: string;
  codecPreference?: VideoCodecPreference;
  peers?: string[];
  initialPointers?: RemotePointerEvent[];
  blurRegions?: PrivacyBlurRegion[];
  peerConnections?: Array<{
    addTrack?: (track: MediaStreamTrack, stream: MediaStream) => void;
    getSenders?: () => Array<{
      track?: MediaStreamTrack | null;
      getParameters?: () => any;
      setParameters?: (params: any) => Promise<void> | void;
    }>;
  }>;
  onStreamStateChange?: (active: boolean) => void;
}

export const ScreenShareDebug: React.FC<ScreenShareDebugProps> = ({
  roomId,
  codecPreference = "VP9",
  peers = ["peer-1", "peer-2"],
  initialPointers = [],
  blurRegions = [
    {
      id: "env-secrets",
      label: "Masked Env / Tokens",
      xPct: 62,
      yPct: 10,
      widthPct: 32,
      heightPct: 22,
    },
  ],
  peerConnections = [],
  onStreamStateChange,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const [sharing, setSharing] = useState(false);
  const [privacyPaused, setPrivacyPaused] = useState(false);
  const [blurShieldEnabled, setBlurShieldEnabled] = useState(true);
  const [talkbackEnabled, setTalkbackEnabled] = useState(false);
  const [bandwidthKbps, setBandwidthKbps] = useState(3200);
  const [qualityProfile, setQualityProfile] = useState<StreamQualityProfile>(
    selectAdaptiveQualityProfile(3200),
  );
  const [pointers, setPointers] = useState<RemotePointerEvent[]>(initialPointers);
  const [statusMessage, setStatusMessage] = useState<string>(
    `Ready for pair debugging (${codecPreference}) in room ${roomId}`,
  );

  const applyAdaptiveBitrate = useCallback(
    async (kbps: number) => {
      setBandwidthKbps(kbps);
      const nextProfile = selectAdaptiveQualityProfile(kbps);
      setQualityProfile(nextProfile);

      for (const pc of peerConnections) {
        const senders = pc.getSenders?.() ?? [];
        for (const sender of senders) {
          if (sender.track?.kind === "video" && sender.getParameters && sender.setParameters) {
            const params = sender.getParameters();
            params.encodings = [
              {
                ...(params.encodings?.[0] ?? {}),
                maxBitrate: nextProfile.maxBitrateBps,
                scaleResolutionDownBy:
                  nextProfile.label === "1080p30"
                    ? 1
                    : nextProfile.label === "720p30"
                      ? 1.5
                      : 2.25,
              },
            ];
            await sender.setParameters(params);
          }
        }
      }
    },
    [peerConnections],
  );

  const startScreenShare = useCallback(async () => {
    const mediaDevices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!mediaDevices?.getDisplayMedia) {
      setStatusMessage("Screen capture unavailable in this environment");
      return;
    }

    const stream = await mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: false,
    });

    displayStreamRef.current = stream;
    if (videoRef.current) {
      (videoRef.current as any).srcObject = stream;
    }

    for (const pc of peerConnections) {
      for (const track of stream.getVideoTracks()) {
        pc.addTrack?.(track, stream);
      }
    }

    setSharing(true);
    setPrivacyPaused(false);
    setStatusMessage(
      `Streaming 1080p30 (${codecPreference}) to ${peers.length} peers`,
    );
    onStreamStateChange?.(true);
  }, [codecPreference, onStreamStateChange, peerConnections, peers.length]);

  const stopScreenShare = useCallback(() => {
    displayStreamRef.current?.getTracks().forEach((t) => t.stop());
    displayStreamRef.current = null;
    setSharing(false);
    setPrivacyPaused(false);
    setStatusMessage("Screen share stopped");
    onStreamStateChange?.(false);
  }, [onStreamStateChange]);

  const togglePrivacyPause = () => {
    const nextPaused = !privacyPaused;
    setPrivacyPaused(nextPaused);
    displayStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !nextPaused;
    });
    setStatusMessage(
      nextPaused ? "Privacy Shield: stream paused" : "Privacy Shield: stream resumed",
    );
  };

  const toggleAudioTalkback = async () => {
    if (talkbackEnabled) {
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
      setTalkbackEnabled(false);
      return;
    }

    const mediaDevices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (mediaDevices?.getUserMedia) {
      const micStream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      audioStreamRef.current = micStream;
      for (const pc of peerConnections) {
        for (const track of micStream.getAudioTracks()) {
          pc.addTrack?.(track, micStream);
        }
      }
    }
    setTalkbackEnabled(true);
  };

  useEffect(() => {
    return () => {
      displayStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div
      data-testid="screen-share-debug-controller"
      data-codec={codecPreference}
      data-quality={qualityProfile.label}
      className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100"
    >
      {/* Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white">
            Pair Debugging Viewport · Room {roomId}
          </h2>
          <p data-testid="screen-share-status" className="text-xs text-zinc-400">
            {statusMessage} · Profile: {qualityProfile.label} ({codecPreference})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!sharing ? (
            <button
              type="button"
              data-testid="start-share-btn"
              onClick={startScreenShare}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Monitor className="h-3.5 w-3.5" /> Start Share
            </button>
          ) : (
            <button
              type="button"
              data-testid="stop-share-btn"
              onClick={stopScreenShare}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
            >
              <MonitorOff className="h-3.5 w-3.5" /> Stop Share
            </button>
          )}

          <button
            type="button"
            data-testid="toggle-privacy-pause-btn"
            aria-pressed={privacyPaused}
            onClick={togglePrivacyPause}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            {privacyPaused ? "Resume Stream" : "Pause Stream"}
          </button>

          <button
            type="button"
            data-testid="toggle-blur-shield-btn"
            aria-pressed={blurShieldEnabled}
            onClick={() => setBlurShieldEnabled((b) => !b)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
          >
            {blurShieldEnabled ? (
              <EyeOff className="h-3.5 w-3.5 text-cyan-400" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-zinc-400" />
            )}
            Blur Shield
          </button>

          <button
            type="button"
            data-testid="toggle-talkback-btn"
            aria-pressed={talkbackEnabled}
            onClick={toggleAudioTalkback}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-800"
          >
            {talkbackEnabled ? (
              <Mic className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <MicOff className="h-3.5 w-3.5 text-zinc-400" />
            )}
            {talkbackEnabled ? "AEC Talkback On" : "AEC Talkback Off"}
          </button>
        </div>
      </div>

      {/* Bandwidth Simulation Bar for Adaptive Bitrate & Resolution */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 font-mono text-cyan-300">
          <Gauge className="h-4 w-4" />
          <span data-testid="bandwidth-kbps-label">
            Link Bandwidth: {bandwidthKbps} kbps → {qualityProfile.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="bw-high-btn"
            onClick={() => applyAdaptiveBitrate(3200)}
            className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] hover:bg-zinc-800"
          >
            3200 kbps
          </button>
          <button
            type="button"
            data-testid="bw-low-btn"
            onClick={() => applyAdaptiveBitrate(450)}
            className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] hover:bg-zinc-800"
          >
            450 kbps (Low BW)
          </button>
        </div>
      </div>

      {/* Screen Viewport + Remote Cursor & Privacy Blur Overlay */}
      <div className="relative h-80 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <video
          ref={videoRef}
          data-testid="screen-share-video"
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-contain ${privacyPaused ? "opacity-20" : "opacity-100"}`}
        />

        {privacyPaused && (
          <div
            data-testid="privacy-paused-overlay"
            className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 text-sm font-bold text-amber-300"
          >
            Stream Paused by Privacy Shield
          </div>
        )}

        <RemoteCursorLayer
          pointers={pointers}
          blurRegions={blurShieldEnabled ? blurRegions : []}
          onPeerClick={(pt) =>
            setPointers((prev) => [...prev.slice(-14), { ...pt, clicked: true }])
          }
        />
      </div>
    </div>
  );
};

export default ScreenShareDebug;
