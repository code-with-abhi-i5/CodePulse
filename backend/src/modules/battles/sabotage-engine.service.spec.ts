import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  SabotageEngineService,
  SABOTAGE_POWERUPS,
} from './sabotage-engine.service';

describe('SabotageEngineService (#538 Red-Team vs Blue-Team Sabotage Rounds)', () => {
  let service: SabotageEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SabotageEngineService],
    }).compile();

    service = module.get<SabotageEngineService>(SabotageEngineService);
    service.resetState();
  });

  describe('Powerup Catalog & Initial State', () => {
    it('initializes player with 300 streak powerup points and defines all 6 powerups', () => {
      const state = service.getOrCreatePlayerState('battle-101', 'alice', 'Alice');
      expect(state.powerupPoints).toBe(300);
      expect(state.hasShield).toBe(false);
      expect(state.activeSabotages).toHaveLength(0);

      expect(SABOTAGE_POWERUPS.SYNTAX_FOG).toBeDefined();
      expect(SABOTAGE_POWERUPS.VARIABLE_SWAP).toBeDefined();
      expect(SABOTAGE_POWERUPS.INVERTED_BOOLEAN).toBeDefined();
      expect(SABOTAGE_POWERUPS.TEST_SCRAMBLER).toBeDefined();
      expect(SABOTAGE_POWERUPS.CLEANSE_SHIELD).toBeDefined();
      expect(SABOTAGE_POWERUPS.CODE_FORMAT_PURGE).toBeDefined();
    });

    it('awards powerup points on test pass milestones', () => {
      const updated = service.awardPoints('battle-101', 'alice', 150);
      expect(updated).toBe(450);
    });
  });

  describe('AST Code Transformations', () => {
    it('applies Syntax Fog without breaking code line structure', () => {
      const source = 'function add(a, b) {\n  return a + b;\n}';
      const mutated = service.applySyntaxFog(source);

      expect(mutated).toContain('SYNTAX FOG');
      expect(mutated).toContain('function add(a, b)');
      expect(mutated).toContain('return a + b;');
    });

    it('swaps identifier pairs safely with Variable Swap', () => {
      const source = 'function binarySearch(arr, left, right) {\n  return left < right;\n}';
      const mutated = service.applyVariableSwap(source);

      // left and right should be swapped in the signature and return
      expect(mutated).toContain('binarySearch(arr, right, left)');
      expect(mutated).toContain('return right < left;');
    });

    it('inverts boolean logic operators with Inverted Boolean', () => {
      const source = 'if (val === target && isFound === true) { return true; }';
      const mutated = service.applyInvertedBoolean(source);

      expect(mutated).toContain('val !== target');
      expect(mutated).toContain('false');
    });

    it('perturbs test cases with Test Scrambler', () => {
      const source = 'expect(sum(1, 2)).toBe(3);';
      const mutated = service.applyTestScrambler(source);

      expect(mutated).toContain('expect(sum(1, 2)).toEqual(3)');
      expect(mutated).toContain('TEST SCRAMBLER');
    });
  });

  describe('Offensive Sabotage Deployment', () => {
    it('deploys Syntax Fog onto opponent, deducting points and logging audit telemetry', () => {
      const currentCode = 'function twoSum(nums, target) { return []; }';
      const result = service.deploySabotage({
        battleId: 'battle-1',
        attackerId: 'alice',
        attackerUsername: 'Alice',
        targetId: 'bob',
        targetUsername: 'Bob',
        powerupType: 'SYNTAX_FOG',
        currentCode,
      });

      expect(result.success).toBe(true);
      expect(result.deflected).toBe(false);
      expect(result.mutatedCode).toContain('SYNTAX FOG');
      expect(result.bannerMessage).toContain('Alice blinded Bob with a thick cloud of Syntax Fog');
      expect(result.remainingPoints).toBe(200); // 300 - 100

      // Target player should have active sabotage recorded
      const bobSabotages = service.getActiveSabotages('battle-1', 'bob');
      expect(bobSabotages).toHaveLength(1);
      expect(bobSabotages[0].powerupType).toBe('SYNTAX_FOG');

      // Audit trail should be recorded
      const audit = service.getAuditLogs('battle-1');
      expect(audit).toHaveLength(1);
      expect(audit[0].outcome).toBe('DEPLOYED');
      expect(audit[0].powerupType).toBe('SYNTAX_FOG');
    });

    it('throws BadRequestException if player has insufficient points', () => {
      expect(() => {
        service.deploySabotage({
          battleId: 'battle-1',
          attackerId: 'charlie',
          attackerUsername: 'Charlie',
          targetId: 'bob',
          targetUsername: 'Bob',
          powerupType: 'TEST_SCRAMBLER', // costs 250
          currentCode: 'code',
        });
        // Second deployment when points are low (300 - 250 = 50 pts remaining)
        service.deploySabotage({
          battleId: 'battle-1',
          attackerId: 'charlie',
          attackerUsername: 'Charlie',
          targetId: 'bob',
          targetUsername: 'Bob',
          powerupType: 'TEST_SCRAMBLER',
          currentCode: 'code',
        });
      }).toThrow(BadRequestException);
    });
  });

  describe('Defensive Counter-Measures', () => {
    it('deflects incoming sabotage when Cleanse Shield is active', () => {
      // Bob purchases Cleanse Shield (costs 120 pts, 300 - 120 = 180)
      const defenseResult = service.activateDefense({
        battleId: 'battle-1',
        userId: 'bob',
        username: 'Bob',
        defenseType: 'CLEANSE_SHIELD',
        currentCode: 'function solve() { return true; }',
      });
      expect(defenseResult.success).toBe(true);
      expect(defenseResult.remainingPoints).toBe(180);

      const bobState = service.getOrCreatePlayerState('battle-1', 'bob');
      expect(bobState.hasShield).toBe(true);

      // Alice tries to deploy Inverted Boolean against Bob
      const originalCode = 'function solve() { return true; }';
      const attackResult = service.deploySabotage({
        battleId: 'battle-1',
        attackerId: 'alice',
        attackerUsername: 'Alice',
        targetId: 'bob',
        targetUsername: 'Bob',
        powerupType: 'INVERTED_BOOLEAN',
        currentCode: originalCode,
      });

      expect(attackResult.success).toBe(true);
      expect(attackResult.deflected).toBe(true);
      expect(attackResult.mutatedCode).toBe(originalCode); // Unmodified!
      expect(attackResult.bannerMessage).toContain('Bob deflected Alice\'s Inverted Boolean with Cleanse Shield');

      // Shield should be popped
      expect(bobState.hasShield).toBe(false);
      expect(bobState.activeSabotages).toHaveLength(0);
    });

    it('cleanses active sabotages and restores original code buffer with Code Format Purge', () => {
      const originalCode = 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}';

      // Alice attacks Bob with Syntax Fog
      const attack = service.deploySabotage({
        battleId: 'battle-2',
        attackerId: 'alice',
        attackerUsername: 'Alice',
        targetId: 'bob',
        targetUsername: 'Bob',
        powerupType: 'SYNTAX_FOG',
        currentCode: originalCode,
      });

      expect(attack.mutatedCode).not.toBe(originalCode);

      // Bob uses Code Format Purge
      const purgeResult = service.activateDefense({
        battleId: 'battle-2',
        userId: 'bob',
        username: 'Bob',
        defenseType: 'CODE_FORMAT_PURGE',
        currentCode: attack.mutatedCode,
      });

      expect(purgeResult.success).toBe(true);
      expect(purgeResult.purgedCount).toBe(1);
      expect(purgeResult.restoredCode).toBe(originalCode);
      expect(purgeResult.bannerMessage).toContain('Code Format Purge');

      // Active sabotages on Bob should be empty
      const active = service.getActiveSabotages('battle-2', 'bob');
      expect(active).toHaveLength(0);
    });
  });

  describe('30-Second Expiration Engine', () => {
    it('automatically expires sabotages strictly after 30 seconds', () => {
      const now = Date.now();
      const originalCode = 'let left = 0, right = 10;';

      service.deploySabotage({
        battleId: 'battle-exp',
        attackerId: 'alice',
        attackerUsername: 'Alice',
        targetId: 'bob',
        targetUsername: 'Bob',
        powerupType: 'VARIABLE_SWAP',
        currentCode: originalCode,
      });

      // At 15 seconds, sabotage is still active
      const activeAt15s = service.cleanupExpiredSabotages(now + 15000);
      expect(activeAt15s).toHaveLength(0);
      expect(service.getActiveSabotages('battle-exp', 'bob')).toHaveLength(1);

      // At 30.001 seconds, sabotage expires
      const expired = service.cleanupExpiredSabotages(now + 30001);
      expect(expired).toHaveLength(1);
      expect(expired[0].powerupType).toBe('VARIABLE_SWAP');
      expect(expired[0].originalCode).toBe(originalCode);

      // Bob's active sabotages cleared
      expect(service.getActiveSabotages('battle-exp', 'bob')).toHaveLength(0);

      // Expiration logged in audit
      const audit = service.getAuditLogs('battle-exp');
      const expiredLog = audit.find((l) => l.outcome === 'EXPIRED');
      expect(expiredLog).toBeDefined();
    });
  });
});
