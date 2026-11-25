/**
 * Architecture Service: Audit Log Merkle Notary
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-32]
 */

import crypto from 'node:crypto';

export class AuditLogMerkleNotaryService {
  public computeMerkleRoot(logEntries: string[]): string {
    if (logEntries.length === 0) {
      return crypto.createHash('sha256').update('EMPTY_TREE').digest('hex');
    }

    let currentLevel = logEntries.map((e) => crypto.createHash('sha256').update(e).digest('hex'));

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          const combined = crypto
            .createHash('sha256')
            .update(`${currentLevel[i]}:${currentLevel[i + 1]}`)
            .digest('hex');
          nextLevel.push(combined);
        } else {
          nextLevel.push(currentLevel[i]);
        }
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  public createNotaryProof(dateStr: string, logEntries: string[]): {
    date: string;
    merkleRoot: string;
    entryCount: number;
    notarizedAt: number;
  } {
    const merkleRoot = this.computeMerkleRoot(logEntries);
    return {
      date: dateStr,
      merkleRoot,
      entryCount: logEntries.length,
      notarizedAt: Date.now()
    };
  }
}
