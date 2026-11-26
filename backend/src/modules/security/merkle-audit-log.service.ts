import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { MerkleAuditEntry } from '../../types/security';

@Injectable()
export class MerkleAuditLogService {
  private readonly chain: MerkleAuditEntry[] = [];

  appendAuditAction(adminId: string, action: string, details: any): { entryHash: string; merkleRoot: string } {
    const index = this.chain.length;
    const timestamp = Date.now();
    const prevHash = index > 0 ? this.chain[index - 1].entryHash : '00000000000000000000000000000000';
    const detailsHash = crypto.createHash('sha256').update(JSON.stringify(details)).digest('hex');

    const entryHash = crypto.createHash('sha256')
      .update(`${index}:${timestamp}:${adminId}:${action}:${detailsHash}:${prevHash}`)
      .digest('hex');

    const entry: MerkleAuditEntry = {
      index,
      timestamp,
      adminId,
      action,
      detailsHash,
      prevHash,
      entryHash,
    };
    this.chain.push(entry);

    return {
      entryHash,
      merkleRoot: this.computeMerkleRoot(),
    };
  }

  computeMerkleRoot(): string {
    if (this.chain.length === 0) return '';
    let currentLevel = this.chain.map(e => e.entryHash);
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = (i + 1 < currentLevel.length) ? currentLevel[i + 1] : left;
        nextLevel.push(crypto.createHash('sha256').update(left + right).digest('hex'));
      }
      currentLevel = nextLevel;
    }
    return currentLevel[0];
  }

  verifyChainIntegrity(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      if (this.chain[i].prevHash !== this.chain[i - 1].entryHash) {
        return false;
      }
    }
    return true;
  }
}
