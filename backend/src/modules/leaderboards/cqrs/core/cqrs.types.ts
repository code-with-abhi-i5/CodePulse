import { Type } from '@nestjs/common';

export interface ICommand {}

export interface ICommandHandler<TCommand extends ICommand = any, TResult = any> {
  execute(command: TCommand): Promise<TResult>;
}

export interface IQuery {}

export interface IQueryHandler<TQuery extends IQuery = any, TResult = any> {
  execute(query: TQuery): Promise<TResult>;
}

export interface IEvent {}

export interface IEventHandler<TEvent extends IEvent = any> {
  handle(event: TEvent): Promise<void> | void;
}

export type CommandHandlerType = Type<ICommandHandler<ICommand>>;
export type QueryHandlerType = Type<IQueryHandler<IQuery>>;
export type EventHandlerType = Type<IEventHandler<IEvent>>;
