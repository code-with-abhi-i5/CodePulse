import crypto from 'node:crypto';
import { AuditLedgerBlock } from '../../types/security';

export class TamperEvidentAuditLedgerService {
  private ledger: AuditLedgerBlock[] = [];

  constructor() {
    // Genesis block
    this.ledger.push({
      index: 0,
      timestamp: 0,
      action: 'GENESIS',
      actor: 'SYSTEM',
      payload: {},
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      hash: 'GENESIS_HASH'
    });
  }

  public computeHash(index: number, timestamp: number, action: string, actor: string, payload: Record<string, unknown>, previousHash: string): string {
    const content = `${index}|${timestamp}|${action}|${actor}|${JSON.stringify(payload)}|${previousHash}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  public appendEntry(action: string, actor: string, payload: Record<string, unknown>, timestamp: number = Date.now()): AuditLedgerBlock {
    const prevBlock = this.ledger[this.ledger.length - 1];
    const index = this.ledger.length;
    const hash = this.computeHash(index, timestamp, action, actor, payload, prevBlock.hash);

    const block: AuditLedgerBlock = {
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

  public verifyIntegrity(): { isValid: boolean; corruptedIndex?: number } {
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

  public getBlockCount(): number {
    return this.ledger.length;
  }
}
