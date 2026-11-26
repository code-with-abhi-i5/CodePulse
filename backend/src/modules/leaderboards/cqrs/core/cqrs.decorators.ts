import { SetMetadata, Type } from '@nestjs/common';
import { ICommand, IQuery, IEvent } from './cqrs.types';

export const COMMAND_HANDLER_METADATA = '__commandHandler__';
export const QUERY_HANDLER_METADATA = '__queryHandler__';
export const EVENTS_HANDLER_METADATA = '__eventsHandler__';

/**
 * Decorator that marks a class as a Command Handler for a specific Command.
 */
export const CommandHandler = (command: Type<ICommand>): ClassDecorator => {
  return (target: object) => {
    SetMetadata(COMMAND_HANDLER_METADATA, command)(target);
  };
};

/**
 * Decorator that marks a class as a Query Handler for a specific Query.
 */
export const QueryHandler = (query: Type<IQuery>): ClassDecorator => {
  return (target: object) => {
    SetMetadata(QUERY_HANDLER_METADATA, query)(target);
  };
};

/**
 * Decorator that marks a class as an Event Handler for one or more Events.
 */
export const EventsHandler = (...events: Type<IEvent>[]): ClassDecorator => {
  return (target: object) => {
    SetMetadata(EVENTS_HANDLER_METADATA, events)(target);
  };
};
