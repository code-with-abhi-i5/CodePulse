import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export type SearchEntityType = 'DEVELOPER' | 'REPOSITORY' | 'BATTLE' | 'GUILD';

export interface DecomposedIntent {
  entity: SearchEntityType;
  language: string | null;
  country: string | null;
  minBattles: number | null;
  minElo: number | null;
  minStars?: number | null;
  skills?: string[];
  semanticQuery: string;
  rawQuery: string;
}

export class SmartSearchQueryDto {
  @ApiProperty({
    description: 'Natural language search query',
    example: 'Python developers in Germany with at least 1000 battles',
  })
  @IsString()
  q: string;

  @ApiPropertyOptional({
    description: 'Balance between structured match (1.0) and semantic similarity (0.0)',
    default: 0.6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  alpha?: number = 0.6;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export interface SmartSearchResultItem {
  id: string;
  entity: SearchEntityType;
  title: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  languages?: string[];
  elo?: number | null;
  battlesCount?: number;
  stars?: number;
  structuredScore: number;
  semanticScore: number;
  hybridScore: number;
  matchedFilters: string[];
  highlights?: string[];
  metadata?: Record<string, any>;
}

export interface SmartSearchResponse {
  query: string;
  intent: DecomposedIntent;
  cached: boolean;
  cacheKey: string;
  strategy: 'STRUCTURED' | 'SEMANTIC' | 'HYBRID';
  total: number;
  results: SmartSearchResultItem[];
  executionTimeMs: number;
}
