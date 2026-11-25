/**
 * Architecture Service: Audit Log Immutability Validator
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-16]
 */

import crypto from 'node:crypto';

export interface AuditLogEntry {
  id: string;
  sequence: number;
  payload: string;
  previousHash: string;
  currentHash: string;
}

export class AuditLogImmutabilityValidatorService {
  public computeHash(sequence: number, payload: string, previousHash: string): string {
    return crypto
      .createHash('sha256')
      .update(`${sequence}:${previousHash}:${payload}`)
      .digest('hex');
  }

  public createEntry(sequence: number, payload: string, previousHash: string): AuditLogEntry {
    const currentHash = this.computeHash(sequence, payload, previousHash);
    return {
      id: crypto.randomUUID(),
      sequence,
      payload,
      previousHash,
      currentHash
    };
  }

  public validateChainIntegrity(entries: AuditLogEntry[], genesisHash: string = 'GENESIS_HASH'): {
    isValid: boolean;
    brokenIndex: number;
    error?: string;
  } {
    let expectedPrev = genesisHash;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.previousHash !== expectedPrev) {
        return { isValid: false, brokenIndex: i, error: `Chain broken at sequence ${entry.sequence}: invalid previousHash` };
      }

      const calculated = this.computeHash(entry.sequence, entry.payload, entry.previousHash);
      if (calculated !== entry.currentHash) {
        return { isValid: false, brokenIndex: i, error: `Hash mismatch at sequence ${entry.sequence}: entry has been tampered with` };
      }

      expectedPrev = entry.currentHash;
    }

    return { isValid: true, brokenIndex: -1 };
  }
}
