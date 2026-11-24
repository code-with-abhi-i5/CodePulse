/**
 * @file spectator-chat-filter.module.ts
 * @description NestJS module configuring [NET-CHAT-FILTER-096]: Sub-Millisecond Spectator Battle Chat Filter with C-Based Bloom Filter & Regex Trie.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { SpectatorChatFilterService } from './spectator-chat-filter.service';
import { SpectatorChatFilterController } from './spectator-chat-filter.controller';

@Module({
  controllers: [SpectatorChatFilterController],
  providers: [SpectatorChatFilterService],
  exports: [SpectatorChatFilterService],
})
export class SpectatorChatFilterModule {}
