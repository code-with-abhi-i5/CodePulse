'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Shield,
  Sparkles,
  AlertTriangle,
  Flame,
  X,
  Code2,
  RefreshCw,
  EyeOff,
  Shuffle,
} from 'lucide-react';

export type SabotageType =
  | 'SYNTAX_FOG'
  | 'VARIABLE_SWAP'
  | 'INVERTED_BOOLEAN'
  | 'TEST_SCRAMBLER';

export type DefenseType = 'CLEANSE_SHIELD' | 'CODE_FORMAT_PURGE';

export interface PowerupItem {
  id: SabotageType | DefenseType;
  name: string;
  category: 'OFFENSIVE' | 'DEFENSIVE';
  cost: number;
  description: string;
  iconName: string;
}

export const SABOTAGE_CATALOG: PowerupItem[] = [
  {
    id: 'SYNTAX_FOG',
    name: 'Syntax Fog',
    category: 'OFFENSIVE',
    cost: 100,
    description: 'Pollutes opponent buffer with blinding comments and bracket noise',
    iconName: 'fog',
  },
  {
    id: 'VARIABLE_SWAP',
    name: 'Variable Swap',
    category: 'OFFENSIVE',
    cost: 150,
    description: 'Swaps critical identifier variable pairs (e.g. left ↔ right, min ↔ max)',
    iconName: 'swap',
  },
  {
    id: 'INVERTED_BOOLEAN',
    name: 'Inverted Boolean',
    category: 'OFFENSIVE',
    cost: 200,
    description: 'Flips conditional operators (=== to !==, true to false)',
    iconName: 'boolean',
  },
  {
    id: 'TEST_SCRAMBLER',
    name: 'Test Scrambler',
    category: 'OFFENSIVE',
    cost: 250,
    description: 'Injects chaotic assertion order and boundary condition tests',
    iconName: 'scramble',
  },
  {
    id: 'CLEANSE_SHIELD',
    name: 'Cleanse Shield',
    category: 'DEFENSIVE',
    cost: 120,
    description: 'Defensive energy barrier that absorbs and deflects the next incoming attack',
    iconName: 'shield',
  },
  {
    id: 'CODE_FORMAT_PURGE',
    name: 'Code Format Purge',
    category: 'DEFENSIVE',
    cost: 100,
    description: 'Instantly purges all active sabotages and restores pristine code buffer',
    iconName: 'purge',
  },
];

export interface SabotageStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponentUsername: string;
  powerupPoints: number;
  hasShield?: boolean;
  activeSabotages?: Array<{ powerupType: string; expiresAt: number }>;
  onDeploySabotage: (type: SabotageType) => void;
  onActivateDefense: (type: DefenseType) => void;
}

export const SabotageStoreModal: React.FC<SabotageStoreModalProps> = ({
  isOpen,
  onClose,
  opponentUsername,
  powerupPoints = 300,
  hasShield = false,
  activeSabotages = [],
  onDeploySabotage,
  onActivateDefense,
}) => {
  const [activeTab, setActiveTab] = useState<'OFFENSIVE' | 'DEFENSIVE'>('OFFENSIVE');
  const [recentlyBought, setRecentlyBought] = useState<string | null>(null);

  useEffect(() => {
    if (recentlyBought) {
      const timer = setTimeout(() => setRecentlyBought(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [recentlyBought]);

  if (!isOpen) return null;

  const offensiveItems = SABOTAGE_CATALOG.filter((p) => p.category === 'OFFENSIVE');
  const defensiveItems = SABOTAGE_CATALOG.filter((p) => p.category === 'DEFENSIVE');
  const currentItems = activeTab === 'OFFENSIVE' ? offensiveItems : defensiveItems;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'fog':
        return <EyeOff className="w-5 h-5 text-amber-400" />;
      case 'swap':
        return <Shuffle className="w-5 h-5 text-cyan-400" />;
      case 'boolean':
        return <RefreshCw className="w-5 h-5 text-rose-400" />;
      case 'scramble':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'shield':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'purge':
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      default:
        return <Code2 className="w-5 h-5 text-purple-400" />;
    }
  };

  const handleAction = (item: PowerupItem) => {
    if (powerupPoints < item.cost) return;

    if (item.category === 'OFFENSIVE') {
      onDeploySabotage(item.id as SabotageType);
    } else {
      onActivateDefense(item.id as DefenseType);
    }
    setRecentlyBought(item.name);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sabotage-store-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 id="sabotage-store-title" className="text-lg font-bold text-foreground">
                Sabotage Armory & Powerup Store
              </h2>
              <p className="text-xs text-muted-foreground">
                Targeting opponent: <span className="font-semibold text-foreground">@{opponentUsername}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banners */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 border border-border/60">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-foreground">
              {powerupPoints} Streak Points
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasShield && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Shield className="w-3.5 h-3.5" /> Shield Active
              </span>
            )}
            {activeSabotages.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" /> {activeSabotages.length} Sabotage Active
              </span>
            )}
          </div>
        </div>

        {recentlyBought && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium text-center">
            🚀 Deployed {recentlyBought} successfully!
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/60 border border-border">
          <button
            onClick={() => setActiveTab('OFFENSIVE')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'OFFENSIVE'
                ? 'bg-rose-500/20 text-rose-300 shadow-sm border border-rose-500/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ⚔️ Offensive Sabotages
          </button>
          <button
            onClick={() => setActiveTab('DEFENSIVE')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'DEFENSIVE'
                ? 'bg-blue-500/20 text-blue-300 shadow-sm border border-blue-500/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🛡️ Defensive Shields
          </button>
        </div>

        {/* Powerups List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
          {currentItems.map((item) => {
            const canAfford = powerupPoints >= item.cost;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-background/50 hover:border-purple-500/40 transition-all space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderIcon(item.iconName)}
                      <h4 className="text-xs font-bold text-foreground">{item.name}</h4>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      {item.cost} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <button
                  onClick={() => handleAction(item)}
                  disabled={!canAfford}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    canAfford
                      ? item.category === 'OFFENSIVE'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                  }`}
                >
                  {canAfford ? (item.category === 'OFFENSIVE' ? 'Deploy Sabotage' : 'Activate Defense') : 'Insufficient Points'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
