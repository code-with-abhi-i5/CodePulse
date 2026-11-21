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
}

@Injectable()
export class SabotageEngineService {
  private readonly logger = new Logger(SabotageEngineService.name);

  // In-memory battle player state: battleId -> userId -> PlayerBattleState
  private readonly playerStates = new Map<string, Map<string, PlayerBattleState>>();

  // Active sabotages map: sabotageId -> ActiveSabotageEffect
  private readonly activeSabotages = new Map<string, ActiveSabotageEffect>();

  // Full match audit trail for post-game anti-cheat and replay review
  private readonly auditLogs: SabotageAuditLog[] = [];

  /**
   * Initializes or gets player battle state with starting powerup points
   */
  public getOrCreatePlayerState(
    battleId: string,
    userId: string,
    username = 'Player',
  ): PlayerBattleState {
    if (!this.playerStates.has(battleId)) {
      this.playerStates.set(battleId, new Map());
    }
    const battleMap = this.playerStates.get(battleId)!;

    if (!battleMap.has(userId)) {
      battleMap.set(userId, {
        userId,
        username,
        powerupPoints: 300, // Starting streak points
        hasShield: false,
        activeSabotages: [],
      });
    }

    return battleMap.get(userId)!;
  }

  /**
   * Awards powerup points to a player (e.g. upon passing tests or speed milestones)
   */
  public awardPoints(battleId: string, userId: string, amount: number): number {
    const player = this.getOrCreatePlayerState(battleId, userId);
    player.powerupPoints += amount;
    return player.powerupPoints;
  }

  /**
   * Deploys an offensive sabotage against target opponent
   */
  public deploySabotage(params: {
    battleId: string;
    attackerId: string;
    attackerUsername: string;
    targetId: string;
    targetUsername: string;
    powerupType: SabotageType;
    currentCode: string;
  }): {
    success: boolean;
    deflected: boolean;
    mutatedCode: string;
    bannerMessage: string;
    effect?: ActiveSabotageEffect;
    remainingPoints: number;
  } {
    const { battleId, attackerId, attackerUsername, targetId, targetUsername, powerupType, currentCode } = params;
    const config = SABOTAGE_POWERUPS[powerupType];

    if (!config) {
      throw new BadRequestException(`Unknown sabotage type: ${powerupType}`);
    }

    const attacker = this.getOrCreatePlayerState(battleId, attackerId, attackerUsername);
    const target = this.getOrCreatePlayerState(battleId, targetId, targetUsername);

    // Verify points
    if (attacker.powerupPoints < config.cost) {
      throw new BadRequestException(
        `Insufficient points: ${config.name} requires ${config.cost} pts (available: ${attacker.powerupPoints} pts)`,
      );
    }

    // Deduct points
    attacker.powerupPoints -= config.cost;
    const originalHash = this.hashString(currentCode);

    // Check Cleanse Shield
    if (target.hasShield) {
      target.hasShield = false; // Shield absorbs the attack and pops
      const banner = `🛡️ ${targetUsername} deflected ${attackerUsername}'s ${config.name} with Cleanse Shield!`;

      this.logAudit({
        battleId,
        attackerId,
        targetId,
        powerupType,
        outcome: 'DEFLECTED',
        codeHashBefore: originalHash,
        codeHashAfter: originalHash,
        details: banner,
      });

      return {
        success: true,
        deflected: true,
        mutatedCode: currentCode,
        bannerMessage: banner,
        remainingPoints: attacker.powerupPoints,
      };
    }

    // Transform code buffer using AST mutation
    const mutatedCode = this.applyAstMutation(currentCode, powerupType);
    const mutatedHash = this.hashString(mutatedCode);

    const sabotageId = crypto.randomUUID();
    const now = Date.now();
    const effect: ActiveSabotageEffect = {
      id: sabotageId,
      battleId,
      attackerId,
      attackerUsername,
      targetId,
      targetUsername,
      powerupType,
      originalCode: currentCode,
      mutatedCode,
      appliedAt: now,
      expiresAt: now + config.durationMs,
      isExpired: false,
      blockedByShield: false,
    };

    this.activeSabotages.set(sabotageId, effect);
    target.activeSabotages.push(effect);

    const banner = this.getHumorousBanner(attackerUsername, targetUsername, powerupType);

    this.logAudit({
      battleId,
      attackerId,
      targetId,
      powerupType,
      outcome: 'DEPLOYED',
      codeHashBefore: originalHash,
      codeHashAfter: mutatedHash,
      details: banner,
    });

    return {
      success: true,
      deflected: false,
      mutatedCode,
      bannerMessage: banner,
      effect,
      remainingPoints: attacker.powerupPoints,
    };
  }

  /**
   * Activates defensive countermeasures (Cleanse Shield or Code Format Purge)
   */
  public activateDefense(params: {
    battleId: string;
    userId: string;
    username: string;
    defenseType: DefenseType;
    currentCode: string;
  }): {
    success: boolean;
    restoredCode: string;
    bannerMessage: string;
    remainingPoints: number;
    purgedCount: number;
  } {
    const { battleId, userId, username, defenseType, currentCode } = params;
    const config = SABOTAGE_POWERUPS[defenseType];
    const player = this.getOrCreatePlayerState(battleId, userId, username);

    if (player.powerupPoints < config.cost) {
      throw new BadRequestException(
        `Insufficient points: ${config.name} requires ${config.cost} pts (available: ${player.powerupPoints} pts)`,
      );
    }

    player.powerupPoints -= config.cost;

    if (defenseType === 'CLEANSE_SHIELD') {
      player.hasShield = true;
      const banner = `🛡️ ${username} activated Cleanse Shield! Next incoming sabotage will be deflected.`;

      this.logAudit({
        battleId,
        attackerId: userId,
        targetId: userId,
        powerupType: 'CLEANSE_SHIELD',
        outcome: 'DEPLOYED',
        codeHashBefore: this.hashString(currentCode),
        codeHashAfter: this.hashString(currentCode),
        details: banner,
      });

      return {
        success: true,
        restoredCode: currentCode,
        bannerMessage: banner,
        remainingPoints: player.powerupPoints,
        purgedCount: 0,
      };
    } else {
      // CODE_FORMAT_PURGE: Revert all active sabotages immediately
      let pristineCode = currentCode;
      const activeCount = player.activeSabotages.length;

      if (activeCount > 0) {
        // Find earliest original code
        pristineCode = player.activeSabotages[0].originalCode;
        player.activeSabotages.forEach((s) => {
          s.isExpired = true;
          this.activeSabotages.delete(s.id);
        });
        player.activeSabotages = [];
      }

      const banner = `✨ ${username} executed Code Format Purge, cleansing ${activeCount} active sabotages!`;

      this.logAudit({
        battleId,
        attackerId: userId,
        targetId: userId,
        powerupType: 'CODE_FORMAT_PURGE',
        outcome: 'PURGED',
        codeHashBefore: this.hashString(currentCode),
        codeHashAfter: this.hashString(pristineCode),
        details: banner,
      });

      return {
        success: true,
        restoredCode: pristineCode,
        bannerMessage: banner,
        remainingPoints: player.powerupPoints,
        purgedCount: activeCount,
      };
    }
  }

  /**
   * Applies AST code transformations safely
   */
  public applyAstMutation(code: string, type: SabotageType): string {
    try {
      switch (type) {
        case 'SYNTAX_FOG':
          return this.applySyntaxFog(code);
        case 'VARIABLE_SWAP':
          return this.applyVariableSwap(code);
        case 'INVERTED_BOOLEAN':
          return this.applyInvertedBoolean(code);
        case 'TEST_SCRAMBLER':
          return this.applyTestScrambler(code);
        default:
          return code;
      }
    } catch (err: any) {
      this.logger.warn(`AST mutation failed gracefully: ${err?.message}, falling back to safe noise`);
      return code;
    }
  }

  /**
   * 1. Syntax Fog: injects benign comment smoke without breaking AST parseability
   */
  public applySyntaxFog(code: string): string {
    const lines = code.split('\n');
    const fogComments = [
      '/* 🌫️ [SYNTAX FOG]: Vision obscured by opponent sabotage */',
      '// ⚠️ Warning: Visual distortion field active',
      '/* 🌫️ ¿¿¿ ??? */',
    ];

    const mutatedLines: string[] = [];
    lines.forEach((line, index) => {
      mutatedLines.push(line);
      if (index === 0 || (index % 3 === 0 && line.trim().length > 0)) {
        const fog = fogComments[index % fogComments.length];
        mutatedLines.push(`  ${fog}`);
      }
    });

    return mutatedLines.join('\n');
  }

  /**
   * 2. Variable Swap: swaps occurrences of common pairs of identifier variables
   */
  public applyVariableSwap(code: string): string {
    // Pairs of common identifiers to swap safely
    const candidatePairs: [string, string][] = [
      ['left', 'right'],
      ['min', 'max'],
      ['start', 'end'],
      ['row', 'col'],
      ['key', 'val'],
      ['i', 'j'],
      ['a', 'b'],
    ];

    for (const [v1, v2] of candidatePairs) {
      const reg1 = new RegExp(`\\b${v1}\\b`, 'g');
      const reg2 = new RegExp(`\\b${v2}\\b`, 'g');
      if (reg1.test(code) && reg2.test(code)) {
        const placeholder = `__SABOTAGE_TMP_${Date.now()}__`;
        return code
          .replace(new RegExp(`\\b${v1}\\b`, 'g'), placeholder)
          .replace(new RegExp(`\\b${v2}\\b`, 'g'), v1)
          .replace(new RegExp(placeholder, 'g'), v2);
      }
    }

    // Fallback: replace first found local variable declaration name with obfuscated alias
    return code.replace(/(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/, '$1 $2_obfuscated');
  }

  /**
   * 3. Inverted Boolean: flips comparison operators (=== to !==, true to false)
   */
  public applyInvertedBoolean(code: string): string {
    let transformed = code;
    if (transformed.includes('===')) {
      transformed = transformed.replace(/===/g, '!==');
    } else if (transformed.includes('!==')) {
      transformed = transformed.replace(/!==/g, '===');
    } else if (transformed.includes('==')) {
      transformed = transformed.replace(/==/g, '!=');
    }

    if (/\btrue\b/.test(transformed)) {
      transformed = transformed.replace(/\btrue\b/g, 'false');
    } else if (/\bfalse\b/.test(transformed)) {
      transformed = transformed.replace(/\bfalse\b/g, 'true');
    }

    if (transformed.includes('<=')) {
      transformed = transformed.replace(/<=/g, '>');
    } else if (transformed.includes('<')) {
      transformed = transformed.replace(/</g, '<=');
    }

    return transformed;
  }

  /**
   * 4. Test Scrambler: scrambles assertion expectations or adds boundary perturbation
   */
  public applyTestScrambler(code: string): string {
    const perturbation = '\n// 🧪 [TEST SCRAMBLER]: Boundary condition perturbation injected\n// expect(solution(null)).toBeDefined();\n';
    if (code.includes('expect(')) {
      return code.replace(/expect\((.*?)\)\.toBe\((.*?)\)/g, 'expect($1).toEqual($2)') + perturbation;
    }
    return code + perturbation;
  }

  /**
   * Cleans up expired sabotages (strictly after 30 seconds)
   */
  public cleanupExpiredSabotages(now = Date.now()): ActiveSabotageEffect[] {
    const expired: ActiveSabotageEffect[] = [];

    for (const [id, sabotage] of this.activeSabotages.entries()) {
      if (now >= sabotage.expiresAt && !sabotage.isExpired) {
        sabotage.isExpired = true;
        expired.push(sabotage);
        this.activeSabotages.delete(id);

        // Remove from target player state
        const battleMap = this.playerStates.get(sabotage.battleId);
        if (battleMap) {
          const target = battleMap.get(sabotage.targetId);
          if (target) {
            target.activeSabotages = target.activeSabotages.filter((s) => s.id !== id);
          }
        }

        this.logAudit({
          battleId: sabotage.battleId,
          attackerId: sabotage.attackerId,
          targetId: sabotage.targetId,
          powerupType: sabotage.powerupType,
          outcome: 'EXPIRED',
          codeHashBefore: this.hashString(sabotage.mutatedCode),
          codeHashAfter: this.hashString(sabotage.originalCode),
          details: `Sabotage ${sabotage.powerupType} expired after 30s timeout`,
        });
      }
    }

    return expired;
  }

  public getActiveSabotages(battleId: string, userId: string): ActiveSabotageEffect[] {
    const battleMap = this.playerStates.get(battleId);
    if (!battleMap) return [];
    const player = battleMap.get(userId);
    return player ? player.activeSabotages.filter((s) => !s.isExpired) : [];
  }

  public getAuditLogs(battleId: string): SabotageAuditLog[] {
    return this.auditLogs.filter((log) => log.battleId === battleId);
  }

  private getHumorousBanner(attacker: string, target: string, type: SabotageType): string {
    switch (type) {
      case 'SYNTAX_FOG':
        return `🌫️ ${attacker} blinded ${target} with a thick cloud of Syntax Fog!`;
      case 'VARIABLE_SWAP':
        return `🔀 ${attacker} scrambled ${target}'s brain with Variable Swap!`;
      case 'INVERTED_BOOLEAN':
        return `🔄 ${attacker} inverted reality for ${target} with Inverted Boolean!`;
      case 'TEST_SCRAMBLER':
        return `🧪 ${attacker} injected chaotic assertions into ${target}'s test runner!`;
      default:
        return `⚡ ${attacker} hit ${target} with ${type}!`;
    }
  }

  private hashString(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 12);
  }

  private logAudit(log: Omit<SabotageAuditLog, 'id' | 'timestamp'>): void {
    this.auditLogs.push({
      ...log,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
  }

  public resetState(): void {
    this.playerStates.clear();
    this.activeSabotages.clear();
    this.auditLogs.length = 0;
  }
}
