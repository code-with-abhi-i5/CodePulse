import { ICommand } from '../core/cqrs.types';

export class RecordMatchResultCommand implements ICommand {
  constructor(
    public readonly matchId: string,
    public readonly winnerId: string,
    public readonly loserId: string,
    public readonly winnerScoreDelta: number = 25,
    public readonly loserScoreDelta: number = -15,
    public readonly matchType: string = '1v1_RANKED',
    public readonly metadata?: Record<string, any>,
  ) {}
}
