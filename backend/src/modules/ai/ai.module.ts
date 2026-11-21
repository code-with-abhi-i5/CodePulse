import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { TranspilerService } from './transpiler.service';
import { PrAnalyzerService } from './pr-analyzer.service';

@Module({
  controllers: [AiController],
  providers: [TranspilerService, PrAnalyzerService],
  exports: [TranspilerService, PrAnalyzerService],
})
export class AiModule {}

