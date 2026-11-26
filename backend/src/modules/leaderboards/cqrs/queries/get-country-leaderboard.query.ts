import { IQuery } from '../core/cqrs.types';

export class GetCountryLeaderboardQuery implements IQuery {
  constructor(
    public readonly country: string,
    public readonly limit: number = 20,
    public readonly offset: number = 0,
    public readonly metric: 'rating' | 'commits' = 'rating',
  ) {}
}
