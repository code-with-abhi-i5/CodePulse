/**
 * @file semantic-changelog-generator.module.ts
 * @description NestJS module configuring [AI-CHANGELOG-078]: Semantic Git Commit Clustering & Automated Human-Centric Release Notes Generator.
 * Registers core domain providers, REST controllers, and dependency injections.
 */

import { Module } from '@nestjs/common';
import { SemanticChangelogGeneratorService } from './semantic-changelog-generator.service';
import { SemanticChangelogGeneratorController } from './semantic-changelog-generator.controller';

@Module({
  controllers: [SemanticChangelogGeneratorController],
  providers: [SemanticChangelogGeneratorService],
  exports: [SemanticChangelogGeneratorService],
})
export class SemanticChangelogGeneratorModule {}
