import { Injectable, Logger, Type } from '@nestjs/common';
import { ICommand, ICommandHandler } from './cqrs.types';

@Injectable()
export class CommandBus {
  private readonly logger = new Logger(CommandBus.name);
  private readonly handlers = new Map<string, ICommandHandler<any, any>>();

  public register(command: Type<ICommand>, handler: ICommandHandler<any, any>): void {
    const commandName = command.name;
    if (this.handlers.has(commandName)) {
      this.logger.warn(`Overriding command handler for: ${commandName}`);
    }
    this.handlers.set(commandName, handler);
    this.logger.debug(`Registered command handler for ${commandName}`);
  }

  public registerHandler(handler: ICommandHandler<any, any>, commandType: Type<ICommand>): void {
    this.register(commandType, handler);
  }

  public async execute<TCommand extends ICommand = any, TResult = any>(
    command: TCommand,
  ): Promise<TResult> {
    const commandName = command.constructor.name;
    const handler = this.handlers.get(commandName);

    if (!handler) {
      throw new Error(`No CommandHandler registered for command: ${commandName}`);
    }

    return handler.execute(command);
  }
}
