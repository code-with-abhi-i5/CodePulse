import { Controller, Get, Post, Body, Query, UseGuards, Optional } from '@nestjs/common';
import { PowChallengeGuard } from '../../common/guards/pow-challenge.guard';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { RagCodeSearchService } from './rag-code-search.service';
import { IntentDecomposerService } from './intent-decomposer.service';
import { IndexCodeFileDto, SemanticCodeSearchDto } from './dto/code-search.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    @Optional() private readonly ragCodeSearch?: RagCodeSearchService,
    @Optional() private readonly intentDecomposer?: IntentDecomposerService,
  ) {}

  @Get('smart')
  @ApiOperation({
    summary: 'Intelligent natural language search decomposed into structured filters and hybrid semantic vector matching',
  })
  @ApiQuery({ name: 'q', description: 'Natural language search query', example: 'Python developers in Germany with at least 1000 battles' })
  @ApiQuery({ name: 'alpha', required: false, description: 'Weight between structured match (1.0) and semantic similarity (0.0)', example: 0.6 })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum candidates to return', example: 20 })
  async smartSearch(
    @Query('q') query: string,
    @Query('alpha') alpha?: string,
    @Query('limit') limit?: string,
  ) {
    return this.intentDecomposer?.smartSearch(query, {
      alpha: alpha ? parseFloat(alpha) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get()
  @UseGuards(PowChallengeGuard)
  @ApiOperation({ summary: 'Global search for users and repositories' })
  async search(@Query('q') query: string) {
    return this.searchService.searchGlobal(query);
  }

  @Post('code/index')
  @ApiOperation({ summary: 'Index a repository TypeScript file into hierarchical AST multi-vector chunks' })
  async indexCodeFile(@Body() dto: IndexCodeFileDto) {
    const chunks = await this.ragCodeSearch?.indexFile(dto);
    return { indexedCount: chunks?.length ?? 0, chunks };
  }

  @Post('code/semantic')
  @ApiOperation({ summary: 'Semantic hybrid BM25 + Cosine code search with top-5 Cross-Encoder reranking' })
  async searchSemanticCode(@Body() dto: SemanticCodeSearchDto) {
    return this.ragCodeSearch?.searchSemanticCode(dto);
  }
}
