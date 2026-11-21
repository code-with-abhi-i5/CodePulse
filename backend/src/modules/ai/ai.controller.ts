import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TranspilerService } from './transpiler.service';
import { PrAnalyzerService, PrAnalysisResult } from './pr-analyzer.service';
import {
  TranspileRequestDto,
  TranspileResponseDto,
  SupportedLanguage,
} from './dto/transpiler.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly transpilerService: TranspilerService,
    private readonly prAnalyzer: PrAnalyzerService,
  ) {}

  @Post('transpile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Automated polyglot code transpiler & idiomatic language migration engine',
    description:
      'Transpiles algorithms across TypeScript, Python, Go, and Rust while preserving target language idioms, generating starter code stubs, and verifying output equivalence against reference tests.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully transpiled and verified polyglot code',
    type: TranspileResponseDto,
  })
  async transpileCode(@Body() dto: TranspileRequestDto): Promise<TranspileResponseDto> {
    if (!dto.sourceCode || !dto.sourceLanguage || !dto.targetLanguage) {
      throw new BadRequestException('sourceCode, sourceLanguage, and targetLanguage are required');
    }
    return this.transpilerService.transpile(dto);
  }

  @Post('analyze-pr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI pull request quality, convention, and test coverage analyzer' })
  async analyzePr(@Body() prDetails: any): Promise<PrAnalysisResult> {
    return this.prAnalyzer.analyzePullRequest(prDetails);
  }
}

