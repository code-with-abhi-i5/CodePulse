import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as ts from 'typescript';
import * as crypto from 'crypto';

export type SabotageType =
  | 'SYNTAX_FOG'
  | 'VARIABLE_SWAP'
  | 'INVERTED_BOOLEAN'
  | 'TEST_SCRAMBLER';

export type DefenseType = 'CLEANSE_SHIELD' | 'CODE_FORMAT_PURGE';

export interface PowerupConfig {
  type: SabotageType | DefenseType;
  name: string;
  category: 'OFFENSIVE' | 'DEFENSIVE';
  cost: number;
  description: string;
  durationMs: number;
  icon: string;
}

export const SABOTAGE_POWERUPS: Record<SabotageType | DefenseType, PowerupConfig> = {
  SYNTAX_FOG: {
    type: 'SYNTAX_FOG',
    name: 'Syntax Fog',
    category: 'OFFENSIVE',
    cost: 100,
    description: 'Pollutes code with confounding fog comments and bracket noise',
    durationMs: 30000,
    icon: '🌫️',
  },
  VARIABLE_SWAP: {
    type: 'VARIABLE_SWAP',
    name: 'Variable Swap',
    category: 'OFFENSIVE',
    cost: 150,
    description: 'Inverts local variable identifiers across the function scope',
    durationMs: 30000,
    icon: '🔀',
  },
  INVERTED_BOOLEAN: {
    type: 'INVERTED_BOOLEAN',
    name: 'Inverted Boolean',
    category: 'OFFENSIVE',
    cost: 200,
    description: 'Flips conditional comparison operators (=== to !==, true to false)',
    durationMs: 30000,
    icon: '🔄',
  },
  TEST_SCRAMBLER: {
    type: 'TEST_SCRAMBLER',
    name: 'Test Scrambler',
    category: 'OFFENSIVE',
    cost: 250,
    description: 'Perturbs test case order and injects adversarial boundary conditions',
    durationMs: 30000,
    icon: '🧪',
  },
  CLEANSE_SHIELD: {
    type: 'CLEANSE_SHIELD',
    name: 'Cleanse Shield',
    category: 'DEFENSIVE',
    cost: 120,
    description: 'Defensive energy barrier that absorbs the next incoming sabotage attack',
    durationMs: 45000,
    icon: '🛡️',
  },
  CODE_FORMAT_PURGE: {
    type: 'CODE_FORMAT_PURGE',
    name: 'Code Format Purge',
    category: 'DEFENSIVE',
    cost: 100,
    description: 'Instantly purges all active sabotages and restores pristine code buffer',
    durationMs: 0,
    icon: '✨',
  },
};

export interface ActiveSabotageEffect {
  id: string;
  battleId: string;
  attackerId: string;
  attackerUsername: string;
  targetId: string;
  targetUsername: string;
  powerupType: SabotageType;
  originalCode: string;
  mutatedCode: string;
  appliedAt: number;
  expiresAt: number;
  isExpired: boolean;
  blockedByShield: boolean;
}

export interface PlayerBattleState {
  userId: string;
  username: string;
  powerupPoints: number;
  hasShield: boolean;
  activeSabotages: ActiveSabotageEffect[];
}

export interface SabotageAuditLog {
  id: string;
  battleId: string;
  timestamp: number;
  attackerId: string;
  targetId: string;
  powerupType: SabotageType | DefenseType;
  outcome: 'DEPLOYED' | 'DEFLECTED' | 'PURGED' | 'EXPIRED';
  codeHashBefore: string;
  codeHashAfter: string;
  details: string;
