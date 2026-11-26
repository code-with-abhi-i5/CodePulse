import { IQuery } from '../core/cqrs.types';

export class GetTopDevelopersQuery implements IQuery {
  constructor(
    public readonly limit: number = 20,
    public readonly offset: number = 0,
    public readonly metric: 'rating' | 'commits' = 'rating',
  ) {}
}
