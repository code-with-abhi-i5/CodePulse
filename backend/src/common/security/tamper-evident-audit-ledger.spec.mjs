import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class TamperEvidentAuditLedgerService {
  constructor() {
    this.ledger = [{
      index: 0,
      timestamp: 0,
      action: 'GENESIS',
      actor: 'SYSTEM',
      payload: {},
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      hash: 'GENESIS_HASH'
    }];
  }

  computeHash(index, timestamp, action, actor, payload, previousHash) {
    const content = index + '|' + timestamp + '|' + action + '|' + actor + '|' + JSON.stringify(payload) + '|' + previousHash;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  appendEntry(action, actor, payload, timestamp = Date.now()) {
    const prevBlock = this.ledger[this.ledger.length - 1];
    const index = this.ledger.length;
    const hash = this.computeHash(index, timestamp, action, actor, payload, prevBlock.hash);

    const block = {
      index,
      timestamp,
      action,
      actor,
      payload,
      previousHash: prevBlock.hash,
      hash
    };

    this.ledger.push(block);
    return block;
  }

  verifyIntegrity() {
    for (let i = 1; i < this.ledger.length; i++) {
      const current = this.ledger[i];
      const previous = this.ledger[i - 1];

      if (current.previousHash !== previous.hash) {
        return { isValid: false, corruptedIndex: i };
      }

      const calculated = this.computeHash(current.index, current.timestamp, current.action, current.actor, current.payload, current.previousHash);
      if (calculated !== current.hash) {
        return { isValid: false, corruptedIndex: i };
      }
    }

    return { isValid: true };
  }

  getBlockCount() {
    return this.ledger.length;
  }
}

describe('TamperEvidentAuditLedgerService', () => {
  it('appends audit log entries with SHA-256 hash chains', () => {
    const ledger = new TamperEvidentAuditLedgerService();
    const b1 = ledger.appendEntry('USER_LOGIN', 'user-42', { ip: '1.2.3.4' }, 1000);
    const b2 = ledger.appendEntry('PASSWORD_CHANGE', 'user-42', { method: 'mfa' }, 2000);

    assert.equal(b2.previousHash, b1.hash);
    assert.equal(ledger.getBlockCount(), 3);

    const integrity = ledger.verifyIntegrity();
    assert.equal(integrity.isValid, true);
  });

  it('detects tampering or modifications in chained history', () => {
    const ledger = new TamperEvidentAuditLedgerService();
    ledger.appendEntry('USER_LOGIN', 'user-1', {}, 1000);
    const b2 = ledger.appendEntry('DELETE_RECORD', 'user-1', { id: 99 }, 2000);

    // Tamper with payload
    b2.payload = { id: 99999 };

    const integrity = ledger.verifyIntegrity();
    assert.equal(integrity.isValid, false);
    assert.equal(integrity.corruptedIndex, 2);
  });
});
