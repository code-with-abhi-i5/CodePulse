import { ICommand } from '../core/cqrs.types';

export class SyncUserCommitsCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly newCommitsCount: number,
    public readonly linesAdded: number = 0,
    public readonly repositoryName?: string,
    public readonly country?: string,
    public readonly commitHash?: string,
  ) {}
}
