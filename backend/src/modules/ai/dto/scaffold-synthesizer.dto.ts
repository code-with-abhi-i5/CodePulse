import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GitHubCommitDto {
  @ApiPropertyOptional({ description: 'GitHub Personal Access Token (defaults to process.env.GITHUB_TOKEN)' })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiProperty({ description: 'GitHub Repository Owner (organization or user)' })
  @IsString()
  @IsNotEmpty()
  owner!: string;

  @ApiProperty({ description: 'GitHub Repository Name' })
  @IsString()
  @IsNotEmpty()
  repo!: string;

  @ApiPropertyOptional({ description: 'Base branch to branch off from (default: main)' })
  @IsOptional()
  @IsString()
  baseBranch?: string;

  @ApiProperty({ description: 'Target branch name for the synthesized code' })
  @IsString()
  @IsNotEmpty()
  targetBranch!: string;

  @ApiPropertyOptional({ description: 'Commit message' })
  @IsOptional()
  @IsString()
  commitMessage?: string;
}

export class ScaffoldFromDiagramDto {
  @ApiProperty({
    description: 'Mermaid.js diagram syntax string (Class diagram or Flowchart)',
    example: `classDiagram
    class User {
      +String id
      +String email
      +String name
      +DateTime createdAt
    }
    class Project {
      +String id
      +String title
      +String description
      +DateTime createdAt
    }
    User "1" --> "*" Project : owns`,
  })
  @IsString()
  @IsNotEmpty()
  diagram!: string;

  @ApiPropertyOptional({
    description: 'Diagram specification format (classDiagram, flowchart, or auto)',
    default: 'auto',
  })
  @IsOptional()
  @IsString()
  diagramType?: 'classDiagram' | 'flowchart' | 'auto';

  @ApiPropertyOptional({
    description: 'Root module name to aggregate generated sub-modules',
    default: 'GeneratedApp',
  })
  @IsOptional()
  @IsString()
  moduleName?: string;

  @ApiPropertyOptional({
    description: 'Whether to package the generated project files as a base64 downloadable zip archive',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  packageAsZip?: boolean;

  @ApiPropertyOptional({
    description: 'Optional GitHub repository parameters to commit the synthesized code directly to a branch',
    type: GitHubCommitDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GitHubCommitDto)
  gitHubCommit?: GitHubCommitDto;
}

export class EntitySummaryDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  tableName!: string;

  @ApiProperty()
  fieldsCount!: number;

  @ApiProperty()
  relationsCount!: number;
}

export class GeneratedFileDto {
  @ApiProperty()
  path!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ enum: ['module', 'controller', 'service', 'dto', 'prisma'] })
  type!: 'module' | 'controller' | 'service' | 'dto' | 'prisma';

  @ApiPropertyOptional()
  entityName?: string;
}

export class ScaffoldFromDiagramResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  diagramType!: string;

  @ApiProperty()
  moduleName!: string;

  @ApiProperty({ type: [EntitySummaryDto] })
  entities!: EntitySummaryDto[];

  @ApiProperty({ type: [GeneratedFileDto] })
  generatedFiles!: GeneratedFileDto[];

  @ApiPropertyOptional({ description: 'Base64-encoded zip archive containing all generated files' })
  zipArchiveBase64?: string;

  @ApiPropertyOptional({ description: 'Suggested zip filename' })
  zipFilename?: string;

  @ApiPropertyOptional({ description: 'Size of the zip archive in bytes' })
  zipSizeBytes?: number;

  @ApiPropertyOptional({ description: 'URL to the newly created GitHub branch containing the code' })
  gitHubBranchUrl?: string;

  @ApiProperty()
  summary!: string;
}
