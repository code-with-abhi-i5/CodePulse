import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ReactionCanvas, SPECTATOR_EMOJIS } from './reaction-canvas';

describe('ReactionCanvas Component (#537 Canvas Physics & Live Hype Meter)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Mock HTMLCanvasElement.prototype.getContext
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillText: vi.fn(),
      scale: vi.fn(),
    } as any);

    // Mock requestAnimationFrame and cancelAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders reaction canvas, hype meter gauge, and all 5 spectator emoji buttons', () => {
    render(
      <ReactionCanvas
        battleId="battle_arena_537"
        initialHype={35}
        enableAudio={false}
      />
    );

    expect(screen.getByTestId('reaction-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('hype-meter-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('hype-value')).toHaveTextContent('35');

    // Verify all 5 spectator emojis from issue specs: 🔥, 🚀, 💡, 🤯, 💀
    SPECTATOR_EMOJIS.forEach((emoji) => {
      expect(screen.getByTestId(`reaction-btn-${emoji}`)).toBeInTheDocument();
    });
  });

  it('triggers onReact callback and increments hype when spectator taps emoji', () => {
    const onReactSpy = vi.fn();
    render(
      <ReactionCanvas
        battleId="battle_arena_click"
        initialHype={40}
        onReact={onReactSpy}
        enableAudio={false}
      />
    );

    const rocketButton = screen.getByTestId('reaction-btn-🚀');
    fireEvent.click(rocketButton);

    expect(onReactSpy).toHaveBeenCalledWith('🚀');
    // Local optimistic hype increase
    expect(screen.getByTestId('hype-value')).toHaveTextContent('42');
  });

  it('toggles audio mute state when volume button is clicked', () => {
    render(
      <ReactionCanvas
        battleId="battle_audio_test"
        enableAudio={true}
      />
    );

    const audioToggle = screen.getByRole('button', { name: /mute audio/i });
    expect(audioToggle).toBeInTheDocument();

    fireEvent.click(audioToggle);
    expect(screen.getByRole('button', { name: /unmute audio/i })).toBeInTheDocument();
  });

  it('triggers onHypeBurst and screen shake when hype hits 100%', () => {
    const onHypeBurstSpy = vi.fn();

    const { rerender } = render(
      <ReactionCanvas
        battleId="battle_clutch_final"
        currentHypeIndex={98}
        onHypeBurst={onHypeBurstSpy}
        enableAudio={false}
      />
    );

    expect(onHypeBurstSpy).not.toHaveBeenCalled();

    // Push hype to 100%
    rerender(
      <ReactionCanvas
        battleId="battle_clutch_final"
        currentHypeIndex={100}
        onHypeBurst={onHypeBurstSpy}
        enableAudio={false}
      />
    );

    expect(onHypeBurstSpy).toHaveBeenCalledWith('battle_clutch_final');
    expect(screen.getByText(/Hype Storm Active!/i)).toBeInTheDocument();

    const container = screen.getByTestId('reaction-canvas-container');
    expect(container.className).toContain('ring-2 ring-red-500/50');
  });

  it('enforces automatic particle culling on mobile devices', () => {
    render(
      <ReactionCanvas
        battleId="battle_mobile_cull"
        isMobileOverride={true}
        maxParticlesMobile={50}
        enableAudio={false}
      />
    );

    expect(screen.getByText(/50 \(Mobile\)/i)).toBeInTheDocument();

    // Trigger multiple emoji reactions
    const fireBtn = screen.getByTestId('reaction-btn-🔥');
    for (let i = 0; i < 20; i++) {
      fireEvent.click(fireBtn);
    }

    // Step animation frames
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const particlesFooter = screen.getByText(/Particles: \d+\/50/i);
    expect(particlesFooter).toBeInTheDocument();
  });

  it('supports keyboard hotkeys (1-5) for spectator reactions', () => {
    const onReactSpy = vi.fn();
    render(
      <ReactionCanvas
        battleId="battle_key_shortcuts"
        onReact={onReactSpy}
        enableAudio={false}
      />
    );

    // Key '1' triggers 🔥
    fireEvent.keyDown(window, { key: '1' });
    expect(onReactSpy).toHaveBeenCalledWith('🔥');

    // Key '4' triggers 🤯
    fireEvent.keyDown(window, { key: '4' });
    expect(onReactSpy).toHaveBeenCalledWith('🤯');
  });
});
