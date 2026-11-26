import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ScreenShareDebug } from "./screen-share-debug";
import { computeVisualLatencyMs } from "./remote-cursor-layer";

describe("ScreenShareDebug & RemoteCursorLayer (getDisplayMedia, WebRTC Tracks, Adaptive BW & <40ms Cursors)", () => {
  const mockVideoTrack = {
    kind: "video",
    enabled: true,
    stop: vi.fn(),
  } as unknown as MediaStreamTrack;

  const mockAudioTrack = {
    kind: "audio",
    enabled: true,
    stop: vi.fn(),
  } as unknown as MediaStreamTrack;

  const mockDisplayStream = {
    getVideoTracks: () => [mockVideoTrack],
    getAudioTracks: () => [],
    getTracks: () => [mockVideoTrack],
  } as unknown as MediaStream;

  const mockMicStream = {
    getVideoTracks: () => [],
    getAudioTracks: () => [mockAudioTrack],
    getTracks: () => [mockAudioTrack],
  } as unknown as MediaStream;

  const getDisplayMedia = vi.fn().mockResolvedValue(mockDisplayStream);
  const getUserMedia = vi.fn().mockResolvedValue(mockMicStream);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global.navigator, "mediaDevices", {
      configurable: true,
      value: {
        getDisplayMedia,
        getUserMedia,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests 1080p30 getDisplayMedia, attaches tracks to WebRTC peers, degrades resolution on low bandwidth, and enables AEC talkback", async () => {
    const addTrack = vi.fn();
    const setParameters = vi.fn();
    const mockPeer = {
      addTrack,
      getSenders: () => [
        {
          track: mockVideoTrack,
          getParameters: () => ({ encodings: [{}] }),
          setParameters,
        },
      ],
    };

    render(
      <ScreenShareDebug
        roomId="pair-debug-587"
        codecPreference="VP9"
        peerConnections={[mockPeer]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("start-share-btn"));
    });

    expect(getDisplayMedia).toHaveBeenCalledTimes(1);
    expect(addTrack).toHaveBeenCalledWith(mockVideoTrack, mockDisplayStream);
    expect(screen.getByTestId("screen-share-debug-controller").getAttribute("data-quality")).toBe(
      "1080p30",
    );

    // Degrade gracefully when bandwidth drops to 450 kbps
    await act(async () => {
      fireEvent.click(screen.getByTestId("bw-low-btn"));
    });
    expect(screen.getByTestId("screen-share-debug-controller").getAttribute("data-quality")).toBe(
      "480p15",
    );
    expect(setParameters).toHaveBeenCalled();

    // Enable audio talkback with AEC & noise suppression
    await act(async () => {
      fireEvent.click(screen.getByTestId("toggle-talkback-btn"));
    });
    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: expect.objectContaining({
          echoCancellation: true,
          noiseSuppression: true,
        }),
      }),
    );

    // Privacy shield pause & blur shield toggle
    fireEvent.click(screen.getByTestId("toggle-privacy-pause-btn"));
    expect(screen.getByTestId("privacy-paused-overlay")).toBeTruthy();
  });

  it("renders remote peer cursors & laser pointer trails with <40ms visual latency", () => {
    expect(computeVisualLatencyMs(1000, 1024)).toBeLessThan(40);

    render(
      <ScreenShareDebug
        roomId="pair-debug-587"
        nowMs={1020}
        initialPointers={[
          {
            peerId: "peer-a",
            peerName: "Alex",
            xNormalized: 0.45,
            yNormalized: 0.55,
            timestampMs: 1000,
            clicked: true,
          },
        ]}
      />,
    );

    const cursor = screen.getByTestId("remote-cursor-peer-a");
    expect(cursor.getAttribute("data-sub-40ms")).toBe("true");
    expect(screen.getByTestId("click-ripple-peer-a")).toBeTruthy();
  });
});
