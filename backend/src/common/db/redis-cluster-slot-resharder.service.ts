import { ReshardingSlotState } from '../../types/db';

export class RedisClusterSlotResharderService {
  planSlotMigration(slotId: number, sourceNode: string, destinationNode: string): ReshardingSlotState {
    return {
      slotId,
      sourceNode,
      destinationNode,
      status: 'MIGRATING',
      keysMigrated: 0
    };
  }

  generateMigrationCommands(slotId: number, sourceNode: string, destNode: string): string[] {
    return [
      'CLUSTER SETSLOT ' + slotId + ' IMPORTING ' + sourceNode,
      'CLUSTER SETSLOT ' + slotId + ' MIGRATING ' + destNode,
      'CLUSTER SETSLOT ' + slotId + ' NODE ' + destNode
    ];
  }
}
