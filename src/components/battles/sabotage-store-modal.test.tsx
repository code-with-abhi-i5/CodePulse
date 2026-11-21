import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SabotageStoreModal } from './sabotage-store-modal';

describe('SabotageStoreModal (#538 Battle Sabotage Armory)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    opponentUsername: 'bob_the_coder',
    powerupPoints: 300,
    hasShield: false,
    activeSabotages: [],
    onDeploySabotage: vi.fn(),
    onActivateDefense: vi.fn(),
  };

  it('renders modal with opponent username and points balance when open', () => {
    render(<SabotageStoreModal {...defaultProps} />);

    expect(screen.getByText('Sabotage Armory & Powerup Store')).toBeInTheDocument();
    expect(screen.getByText('@bob_the_coder')).toBeInTheDocument();
    expect(screen.getByText('300 Streak Points')).toBeInTheDocument();
    expect(screen.getByText('Syntax Fog')).toBeInTheDocument();
    expect(screen.getByText('Variable Swap')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<SabotageStoreModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('triggers onDeploySabotage when clicking deploy on an affordable offensive powerup', () => {
    const onDeploy = vi.fn();
    render(<SabotageStoreModal {...defaultProps} onDeploySabotage={onDeploy} />);

    // Syntax Fog costs 100 pts (player has 300)
    const deployButtons = screen.getAllByRole('button', { name: /deploy sabotage/i });
    fireEvent.click(deployButtons[0]);

    expect(onDeploy).toHaveBeenCalledWith('SYNTAX_FOG');
  });

  it('switches tabs to defensive shields and triggers onActivateDefense', () => {
    const onDefense = vi.fn();
    render(<SabotageStoreModal {...defaultProps} onActivateDefense={onDefense} />);

    // Switch to Defensive tab
    const defenseTab = screen.getByRole('button', { name: /defensive shields/i });
    fireEvent.click(defenseTab);

    expect(screen.getByText('Cleanse Shield')).toBeInTheDocument();
    expect(screen.getByText('Code Format Purge')).toBeInTheDocument();

    const activateButtons = screen.getAllByRole('button', { name: /activate defense/i });
    fireEvent.click(activateButtons[0]); // Cleanse Shield

    expect(onDefense).toHaveBeenCalledWith('CLEANSE_SHIELD');
  });

  it('disables buttons when powerup points are insufficient', () => {
    render(<SabotageStoreModal {...defaultProps} powerupPoints={50} />);

    const buttons = screen.getAllByRole('button', { name: /insufficient points/i });
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]).toBeDisabled();
  });

  it('displays active shield and sabotage warning badges when status flags are set', () => {
    render(
      <SabotageStoreModal
        {...defaultProps}
        hasShield={true}
        activeSabotages={[{ powerupType: 'SYNTAX_FOG', expiresAt: Date.now() + 30000 }]}
      />,
    );

    expect(screen.getByText('Shield Active')).toBeInTheDocument();
    expect(screen.getByText('1 Sabotage Active')).toBeInTheDocument();
  });

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn();
    render(<SabotageStoreModal {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByLabelText('Close modal');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
