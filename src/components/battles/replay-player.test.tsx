import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReplayPlayer, BattleReplaySession } from './replay-player';

const mockSession: BattleReplaySession = {
  metadata: {
    battleId: 'test-battle-42',
    challengerId: 'player-alice',
    challengerUsername: 'Alice_Coder',
    opponentId: 'player-bob',
    opponentUsername: 'Bob_Hacker',
    durationMs: 60000,
    startTime: '2026-11-24T00:00:00.000Z',
    endTime: '2026-11-24T00:01:00.000Z',
    winnerId: 'player-alice',
    totalActions: 5,
    totalSnapshots: 2,
  },
  snapshots: [
    {
      seq: 0,
      timestamp: 0,
      players: {
        'player-alice': {
          code: 'function solve() {\n',
          cursorPosition: 19,
          health: 100,
          testsPassed: 0,
          totalTests: 4,
          score: 0,
          activeSabotages: [],
        },
        'player-bob': {
          code: 'function solve() {\n',
          cursorPosition: 19,
          health: 100,
          testsPassed: 0,
          totalTests: 4,
          score: 0,
          activeSabotages: [],
        },
      },
    },
    {
      seq: 2,
      timestamp: 5000,
      players: {
        'player-alice': {
          code: 'function solve() {\n  return 1;\n',
          cursorPosition: 31,
          health: 100,
          testsPassed: 1,
          totalTests: 4,
          score: 50,
          activeSabotages: [],
        },
        'player-bob': {
          code: 'function solve() {\n',
          cursorPosition: 19,
          health: 80,
          testsPassed: 0,
          totalTests: 4,
          score: 0,
          activeSabotages: ['INVERT'],
        },
      },
    },
  ],
  actions: [
    {
      seq: 1,
      timestamp: 2000,
      playerId: 'player-alice',
      type: 'COMPILE_ERROR',
      payload: { errorMessage: 'SyntaxError: missing ) after argument list' },
    },
    {
      seq: 2,
      timestamp: 5000,
      playerId: 'player-alice',
      type: 'TEST_EXECUTION',
      payload: { testsPassed: 1, totalTests: 4 },
    },
    {
      seq: 3,
      timestamp: 10000,
      playerId: 'player-bob',
      type: 'HP_DELTA',
      payload: { hpDelta: -30 },
    },
    {
      seq: 4,
      timestamp: 15000,
      playerId: 'player-bob',
      type: 'SABOTAGE_TRIGGER',
      payload: { sabotageType: 'VIM_LOCK' },
    },
  ],
  timelineMarkers: [
    {
      seq: 1,
      timestamp: 2000,
      playerId: 'player-alice',
      label: 'Compile Error: SyntaxError',
      type: 'COMPILE_ERROR',
    },
    {
      seq: 2,
      timestamp: 5000,
      playerId: 'player-alice',
      label: 'Test Passed: 1/4',
      type: 'TEST_PASS',
    },
    {
      seq: 3,
      timestamp: 10000,
      playerId: 'player-bob',
      label: 'Critical Hit on Bob',
      type: 'CRITICAL_HIT',
    },
    {
      seq: 4,
      timestamp: 15000,
      playerId: 'player-bob',
      label: 'Sabotage: VIM_LOCK',
      type: 'SABOTAGE',
    },
  ],
};

describe('ReplayPlayer Component', () => {
  it('renders match metadata, participants, and winner', () => {
    render(<ReplayPlayer session={mockSession} />);

    expect(screen.getByText(/Match Replay: Alice_Coder vs Bob_Hacker/i)).toBeInTheDocument();
    expect(screen.getByText(/Winner: Alice_Coder/i)).toBeInTheDocument();
    expect(screen.getByTestId('player-pane-challenger')).toBeInTheDocument();
    expect(screen.getByTestId('player-pane-opponent')).toBeInTheDocument();
  });

  it('renders playback controls and toggles Play/Pause', () => {
    render(<ReplayPlayer session={mockSession} />);

    const playPauseBtn = screen.getByTestId('replay-play-pause-button');
    expect(playPauseBtn.textContent).toContain('Play');

    fireEvent.click(playPauseBtn);
    expect(playPauseBtn.textContent).toContain('Pause');

    fireEvent.click(playPauseBtn);
    expect(playPauseBtn.textContent).toContain('Play');
  });

  it('supports variable playback speed controls (0.5x, 1x, 2x, 4x)', () => {
    render(<ReplayPlayer session={mockSession} />);

    const speed2x = screen.getByTestId('speed-2x');
    const speed4x = screen.getByTestId('speed-4x');

    fireEvent.click(speed2x);
    expect(speed2x.className).toContain('bg-indigo-600');

    fireEvent.click(speed4x);
    expect(speed4x.className).toContain('bg-indigo-600');
  });

  it('supports step back and step forward buttons', () => {
    render(<ReplayPlayer session={mockSession} />);

    const stepForwardBtn = screen.getByTestId('replay-step-forward-button');
    const stepBackBtn = screen.getByTestId('replay-step-back-button');

    fireEvent.click(stepForwardBtn);
    fireEvent.click(stepBackBtn);

    expect(screen.getByTestId('replay-reset-button')).toBeInTheDocument();
  });

  it('renders timeline markers and allows clicking to seek', () => {
    render(<ReplayPlayer session={mockSession} />);

    const compileErrorMarker = screen.getByTestId('marker-compile_error');
    expect(compileErrorMarker).toBeInTheDocument();

    const testPassMarker = screen.getByTestId('marker-test_pass');
    expect(testPassMarker).toBeInTheDocument();

    const critMarker = screen.getByTestId('marker-critical_hit');
    expect(critMarker).toBeInTheDocument();

    // Clicking marker triggers seek
    fireEvent.click(testPassMarker);
  });
});

