/**
 * @file highspeed-git-commit-secret.module.ts
 * @description NestJS module configuring [SEC-SECRET-SCAN-116]: High-Speed Git Commit Secret Scanner with High-Entropy Detection & AST Regex Rules.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { HighspeedGitCommitSecretService } from './highspeed-git-commit-secret.service';
import { HighspeedGitCommitSecretController } from './highspeed-git-commit-secret.controller';

@Module({
  controllers: [HighspeedGitCommitSecretController],
  providers: [HighspeedGitCommitSecretService],
  exports: [HighspeedGitCommitSecretService],
})
export class HighspeedGitCommitSecretModule {}
