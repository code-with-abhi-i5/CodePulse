import { IEvent } from '../core/cqrs.types';

export class MatchResultRecordedEvent implements IEvent {
  constructor(
    public readonly matchId: string,
    public readonly winnerId: string,
    public readonly loserId: string,
    public readonly winnerNewScore: number,
    public readonly loserNewScore: number,
    public readonly winnerCountry?: string,
    public readonly loserCountry?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
