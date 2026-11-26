import { Injectable, Logger, Type } from '@nestjs/common';
import { IEvent, IEventHandler } from './cqrs.types';

@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);
  private readonly handlers = new Map<string, Set<IEventHandler<any>>>();

  public register(event: Type<IEvent>, handler: IEventHandler<any>): void {
    const eventName = event.name;
    let handlersSet = this.handlers.get(eventName);
    if (!handlersSet) {
      handlersSet = new Set();
      this.handlers.set(eventName, handlersSet);
    }
    handlersSet.add(handler);
    this.logger.debug(`Registered event handler for ${eventName}`);
  }

  public registerHandler(handler: IEventHandler<any>, eventTypes: Type<IEvent>[]): void {
    for (const evt of eventTypes) {
      this.register(evt, handler);
    }
  }

  /**
   * Publishes an event to all registered projectors/handlers asynchronously.
   */
  public publish<TEvent extends IEvent = any>(event: TEvent): Promise<void> {
    const eventName = event.constructor.name;
    const handlersSet = this.handlers.get(eventName);

    if (!handlersSet || handlersSet.size === 0) {
      this.logger.debug(`No event handlers registered for: ${eventName}`);
      return Promise.resolve();
    }

    // Execute handlers asynchronously (eventual consistency projections)
    const promises: Promise<void>[] = [];
    for (const handler of handlersSet) {
      try {
        const result = handler.handle(event);
        if (result instanceof Promise) {
          promises.push(
            result.catch((err) => {
              this.logger.error(`Error in async event handler for ${eventName}: ${err.message}`, err.stack);
            }),
          );
        }
      } catch (err: any) {
        this.logger.error(`Synchronous error in event handler for ${eventName}: ${err.message}`, err.stack);
      }
    }

    return Promise.all(promises).then(() => {});
  }

  public async publishAll(events: IEvent[]): Promise<void> {
    for (const evt of events) {
      await this.publish(evt);
    }
  }
}
