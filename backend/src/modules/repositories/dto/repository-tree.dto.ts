import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryRepositoryTreeDto {
  @ApiPropertyOptional({
    description: 'Git tree SHA or branch name (defaults to repository default branch)',
  })
  @IsOptional()
  @IsString()
  ref?: string;

  @ApiPropertyOptional({
    description: 'Directory path to scope exploration to (relative from root)',
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    description: 'Max tree recursion depth (1 to 10)',
    default: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  depth?: number = 3;
}
