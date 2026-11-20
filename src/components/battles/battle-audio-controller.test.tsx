import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BattleAudioController } from './battle-audio-controller';

// Mock SpatialAudioEngine
vi.mock('../audio/spatial-audio-engine', () => {
  return {
    SpatialAudioEngine: vi.fn().mockImplementation(function () {
      return {
        ensureContext: vi.fn().mockResolvedValue({}),
        updateMixSettings: vi.fn((s) => ({
          masterVolume: s.masterVolume ?? 0.8,
          sfxVolume: s.sfxVolume ?? 0.9,
          commentaryVolume: s.commentaryVolume ?? 1.0,
          spatialEnabled: s.spatialEnabled ?? true,
          duckingEnabled: s.duckingEnabled ?? true,
        })),
        updateAdrenalineWpm: vi.fn(),
        playKeystrokeClick: vi.fn(),
        playCompileErrorBuzzer: vi.fn(),
        playTestSuccessChime: vi.fn(),
        playCountdownBeep: vi.fn(),
        getMixSettings: vi.fn(() => ({
          masterVolume: 0.8,
          sfxVolume: 0.9,
          commentaryVolume: 1.0,
          spatialEnabled: true,
          duckingEnabled: true,
        })),
      };
    }),
  };
});

describe('BattleAudioController Component (#581)', () => {
  it('renders initial state with Enable Soundscape button and landmarks', () => {
    render(
      <BattleAudioController
        leftPlayerUsername="Alice"
        rightPlayerUsername="Bob"
        leftPlayerWpm={85}
        rightPlayerWpm={92}
      />,
    );

    expect(screen.getByRole('region', { name: /Battle Audio Soundscape Controller/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Enable Soundscape/i })).toBeDefined();
    expect(screen.getByText(/3D Spatial Audio Soundscape/i)).toBeDefined();
  });

  it('enables audio soundscape upon user click and reveals controls', async () => {
    const onReady = vi.fn();
    render(
      <BattleAudioController
        leftPlayerUsername="Alice"
        rightPlayerUsername="Bob"
        leftPlayerWpm={85}
        rightPlayerWpm={92}
        onAudioEngineReady={onReady}
      />,
    );

    const enableButton = screen.getByRole('button', { name: /Enable Soundscape/i });
    fireEvent.click(enableButton);

    expect(await screen.findByText(/Left: Alice \(85 WPM\)/i)).toBeDefined();
    expect(onReady).toHaveBeenCalled();
    expect(screen.getByText(/Right: Bob \(92 WPM\)/i)).toBeDefined();
  });

  it('switches between Quick Test and Mixer Controls tabs', async () => {
    render(<BattleAudioController />);

    fireEvent.click(screen.getByRole('button', { name: /Enable Soundscape/i }));

    const mixerTab = await screen.findByRole('button', { name: /Mixer Controls/i });
    fireEvent.click(mixerTab);

    expect(screen.getByText(/Master Volume/i)).toBeDefined();
    expect(screen.getByText(/SFX Volume/i)).toBeDefined();
    expect(screen.getByText(/Commentary Audio/i)).toBeDefined();
    expect(screen.getByText(/3D HRTF Spatial Panning/i)).toBeDefined();
  });
});
