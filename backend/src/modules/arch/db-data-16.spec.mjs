import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuditLogImmutabilityValidatorService } from './db-data-16.service.ts';

describe('AuditLogImmutabilityValidatorService (DB-DATA-16)', () => {
  it('validates authentic cryptographic hash chain and flags tampering', () => {
    const validator = new AuditLogImmutabilityValidatorService();
    const genesis = '0000000000000000';

    const e1 = validator.createEntry(1, 'USER_CREATED', genesis);
    const e2 = validator.createEntry(2, 'ROLE_UPDATED', e1.currentHash);
    const e3 = validator.createEntry(3, 'PASSWORD_RESET', e2.currentHash);

    const validChain = [e1, e2, e3];
    assert.strictEqual(validator.validateChainIntegrity(validChain, genesis).isValid, true);

    // Tamper with payload
    const tamperedChain = [
      e1,
      { ...e2, payload: 'MALICIOUS_PAYLOAD' },
      e3
    ];
    const check = validator.validateChainIntegrity(tamperedChain, genesis);
    assert.strictEqual(check.isValid, false);
    assert.strictEqual(check.brokenIndex, 1);
  });
});
