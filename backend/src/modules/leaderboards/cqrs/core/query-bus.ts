import { Injectable, Logger, Type } from '@nestjs/common';
import { IQuery, IQueryHandler } from './cqrs.types';

@Injectable()
export class QueryBus {
  private readonly logger = new Logger(QueryBus.name);
  private readonly handlers = new Map<string, IQueryHandler<any, any>>();

  public register(query: Type<IQuery>, handler: IQueryHandler<any, any>): void {
    const queryName = query.name;
    if (this.handlers.has(queryName)) {
      this.logger.warn(`Overriding query handler for: ${queryName}`);
    }
    this.handlers.set(queryName, handler);
    this.logger.debug(`Registered query handler for ${queryName}`);
  }

  public registerHandler(handler: IQueryHandler<any, any>, queryType: Type<IQuery>): void {
    this.register(queryType, handler);
  }

  public async execute<TQuery extends IQuery = any, TResult = any>(
    query: TQuery,
  ): Promise<TResult> {
    const queryName = query.constructor.name;
    const handler = this.handlers.get(queryName);

    if (!handler) {
      throw new Error(`No QueryHandler registered for query: ${queryName}`);
    }

    return handler.execute(query);
  }
}
