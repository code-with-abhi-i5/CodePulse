import { IEvent } from '../core/cqrs.types';

export class UserCommitsSyncedEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly addedCommits: number,
    public readonly totalCommits: number,
    public readonly newScore: number,
    public readonly country?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
