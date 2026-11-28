import { RedisPipelineBatch } from '../../types/db';

export class RedisPipelineBatcherService {
  // 16384 Redis cluster hash slots CRC16 approximation
  public computeHashSlot(key: string): number {
    const tagMatch = key.match(/\{([^}]+)\}/);
    const target = tagMatch ? tagMatch[1] : key;
    let hash = 0;
    for (let i = 0; i < target.length; i++) {
      hash = (hash * 31 + target.charCodeAt(i)) % 16384;
    }
    return hash;
  }

  public batchCommands(commands: Array<{ command: string; key: string; args?: string[] }>): RedisPipelineBatch[] {
    const slotsMap = new Map<number, Array<{ command: string; args: string[] }>>();

    for (const cmd of commands) {
      const slot = this.computeHashSlot(cmd.key);
      const existing = slotsMap.get(slot) || [];
      existing.push({
        command: cmd.command,
        args: [cmd.key, ...(cmd.args || [])]
      });
      slotsMap.set(slot, existing);
    }

    const batches: RedisPipelineBatch[] = [];
    for (const [slot, cmds] of slotsMap.entries()) {
      batches.push({
        slot,
        commands: cmds,
        totalCommands: cmds.length
      });
    }

    return batches;
  }
}
