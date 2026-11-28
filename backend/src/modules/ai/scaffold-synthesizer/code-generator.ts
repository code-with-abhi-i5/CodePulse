import { ErEntity, ErGraph, ErField, ErRelation } from './diagram-parser';

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'module' | 'controller' | 'service' | 'dto' | 'prisma';
  entityName?: string;
}

export class NestJsCodeGenerator {
  /**
   * Generates complete NestJS module hierarchy and Prisma schema definitions from an ER Graph.
   */
  public generate(graph: ErGraph, rootModuleName = 'GeneratedApp'): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const entityModules: string[] = [];

    // 1. Generate code for each entity
    for (const entity of graph.entities.values()) {
      const kebabName = this.toKebabCase(entity.name);
      const basePath = `src/modules/${kebabName}`;

      // DTOs
      files.push({
        path: `${basePath}/dto/create-${kebabName}.dto.ts`,
        content: this.generateCreateDto(entity),
        type: 'dto',
        entityName: entity.name,
      });

      files.push({
        path: `${basePath}/dto/update-${kebabName}.dto.ts`,
        content: this.generateUpdateDto(entity),
        type: 'dto',
        entityName: entity.name,
      });

      files.push({
        path: `${basePath}/dto/${kebabName}-response.dto.ts`,
        content: this.generateResponseDto(entity),
        type: 'dto',
        entityName: entity.name,
      });

      // Service
      files.push({
        path: `${basePath}/${kebabName}.service.ts`,
        content: this.generateService(entity),
        type: 'service',
        entityName: entity.name,
      });

      // Controller
      files.push({
        path: `${basePath}/${kebabName}.controller.ts`,
        content: this.generateController(entity),
        type: 'controller',
        entityName: entity.name,
      });

      // Module
      files.push({
        path: `${basePath}/${kebabName}.module.ts`,
        content: this.generateModule(entity),
        type: 'module',
        entityName: entity.name,
      });

      entityModules.push(entity.name);
    }

    // 2. Generate Root Aggregator Module
    files.push({
      path: `src/modules/${this.toKebabCase(rootModuleName)}.module.ts`,
      content: this.generateRootModule(rootModuleName, entityModules),
      type: 'module',
    });

    // 3. Generate Complete Prisma Schema
    files.push({
      path: 'prisma/schema.prisma',
      content: this.generatePrismaSchema(graph),
      type: 'prisma',
    });

    return files;
  }

  private generateCreateDto(entity: ErEntity): string {
    const lines: string[] = [
      "import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';",
      "import {",
      '  IsString,',
      '  IsNumber,',
      '  IsBoolean,',
      '  IsDateString,',
      '  IsEmail,',
      '  IsNotEmpty,',
      '  IsOptional,',
      '  IsArray,',
      '  IsUUID,',
      "} from 'class-validator';",
      '',
      `export class Create${entity.name}Dto {`,
    ];

    for (const field of entity.fields) {
      // Skip ID and auto timestamps in creation DTO
      if (field.isId || ['createdAt', 'updatedAt', 'deletedAt'].includes(field.name)) {
        continue;
      }

      const isOptional = !field.isRequired;
      const validatorDecorators: string[] = [];

      if (isOptional) {
        validatorDecorators.push('  @IsOptional()');
      } else {
        validatorDecorators.push('  @IsNotEmpty()');
      }

      if (field.isEmail) {
        validatorDecorators.push('  @IsEmail()');
      } else if (field.isUuid) {
        validatorDecorators.push('  @IsUUID()');
      } else if (field.type === 'string') {
        validatorDecorators.push('  @IsString()');
      } else if (field.type === 'number') {
        validatorDecorators.push('  @IsNumber()');
      } else if (field.type === 'boolean') {
        validatorDecorators.push('  @IsBoolean()');
      } else if (field.type === 'Date') {
        validatorDecorators.push('  @IsDateString()');
      }

      if (field.isList) {
        validatorDecorators.push('  @IsArray()');
      }

      const apiDecorator = isOptional
        ? `  @ApiPropertyOptional({ description: '${field.name} of ${entity.name}' })`
        : `  @ApiProperty({ description: '${field.name} of ${entity.name}' })`;

      lines.push(apiDecorator);
      for (const dec of validatorDecorators) {
        lines.push(dec);
      }

      const tsType = this.toTsType(field);
      lines.push(`  ${field.name}${isOptional ? '?' : '!'}: ${tsType};`);
      lines.push('');
    }

    lines.push('}');
    return lines.join('\n');
  }

  private generateUpdateDto(entity: ErEntity): string {
    const kebab = this.toKebabCase(entity.name);
    return [
      "import { PartialType } from '@nestjs/swagger';",
      `import { Create${entity.name}Dto } from './create-${kebab}.dto';`,
      '',
      `export class Update${entity.name}Dto extends PartialType(Create${entity.name}Dto) {}`,
    ].join('\n');
  }

  private generateResponseDto(entity: ErEntity): string {
    const lines: string[] = [
      "import { ApiProperty } from '@nestjs/swagger';",
      '',
      `export class ${entity.name}ResponseDto {`,
    ];

    for (const field of entity.fields) {
      lines.push(`  @ApiProperty({ description: '${field.name} identifier or property' })`);
      lines.push(`  ${field.name}!: ${this.toTsType(field)};`);
      lines.push('');
    }

    lines.push('}');
    return lines.join('\n');
  }

  private generateService(entity: ErEntity): string {
    const kebab = this.toKebabCase(entity.name);
    const camel = this.toCamelCase(entity.name);

    return [
      "import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';",
      "import { PrismaService } from '../../prisma/prisma.service';",
      `import { Create${entity.name}Dto } from './dto/create-${kebab}.dto';`,
      `import { Update${entity.name}Dto } from './dto/update-${kebab}.dto';`,
      '',
      '@Injectable()',
      `export class ${entity.name}Service {`,
      `  private readonly logger = new Logger(${entity.name}Service.name);`,
      '',
      '  constructor(private readonly prisma: PrismaService) {}',
      '',
      `  async create(createDto: Create${entity.name}Dto) {`,
      `    this.logger.log('Creating new ${entity.name}');`,
      '    try {',
      `      return await (this.prisma as any).${camel}.create({`,
      '        data: createDto,',
      '      });',
      '    } catch (error: any) {',
      "      if (error.code === 'P2002') {",
      `        throw new ConflictException('${entity.name} with unique constraint already exists');`,
      '      }',
      '      throw error;',
      '    }',
      '  }',
      '',
      `  async findAll(skip = 0, take = 50) {`,
      `    const [items, total] = await Promise.all([`,
      `      (this.prisma as any).${camel}.findMany({`,
      '        skip,',
      '        take,',
      "        orderBy: { createdAt: 'desc' },",
      '      }),',
      `      (this.prisma as any).${camel}.count(),`,
      '    ]);',
      '    return { items, total, skip, take };',
      '  }',
      '',
      `  async findOne(id: string) {`,
      `    const item = await (this.prisma as any).${camel}.findUnique({`,
      '      where: { id },',
      '    });',
      '    if (!item) {',
      `      throw new NotFoundException(\`${entity.name} with ID \${id} not found\`);`,
      '    }',
      '    return item;',
      '  }',
      '',
      `  async update(id: string, updateDto: Update${entity.name}Dto) {`,
      `    await this.findOne(id);`,
      `    return await (this.prisma as any).${camel}.update({`,
      '      where: { id },',
      '      data: updateDto,',
      '    });',
      '  }',
      '',
      `  async remove(id: string) {`,
      `    await this.findOne(id);`,
      `    return await (this.prisma as any).${camel}.delete({`,
      '      where: { id },',
      '    });',
      '  }',
      '}',
    ].join('\n');
  }

  private generateController(entity: ErEntity): string {
    const kebab = this.toKebabCase(entity.name);
    const pluralKebab = kebab + 's';

    return [
      "import {",
      '  Controller,',
      '  Get,',
      '  Post,',
      '  Body,',
      '  Patch,',
      '  Param,',
      '  Delete,',
      '  Query,',
      '  ParseIntPipe,',
      '  HttpStatus,',
      '  HttpCode,',
      "} from '@nestjs/common';",
      "import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';",
      `import { ${entity.name}Service } from './${kebab}.service';`,
      `import { Create${entity.name}Dto } from './dto/create-${kebab}.dto';`,
      `import { Update${entity.name}Dto } from './dto/update-${kebab}.dto';`,
      `import { ${entity.name}ResponseDto } from './dto/${kebab}-response.dto';`,
      '',
      `@ApiTags('${entity.name}')`,
      `@Controller('${pluralKebab}')`,
      `export class ${entity.name}Controller {`,
      `  constructor(private readonly service: ${entity.name}Service) {}`,
      '',
      '  @Post()',
      '  @HttpCode(HttpStatus.CREATED)',
      `  @ApiOperation({ summary: 'Create a new ${entity.name}' })`,
      `  @ApiResponse({ status: 201, description: '${entity.name} successfully created', type: ${entity.name}ResponseDto })`,
      `  create(@Body() createDto: Create${entity.name}Dto) {`,
      '    return this.service.create(createDto);',
      '  }',
      '',
      '  @Get()',
      `  @ApiOperation({ summary: 'Retrieve paginated ${entity.name} records' })`,
      "  @ApiQuery({ name: 'skip', required: false, type: Number })",
      "  @ApiQuery({ name: 'take', required: false, type: Number })",
      '  findAll(',
      "    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,",
      "    @Query('take', new ParseIntPipe({ optional: true })) take = 50,",
      '  ) {',
      '    return this.service.findAll(skip, take);',
      '  }',
      '',
      "  @Get(':id')",
      `  @ApiOperation({ summary: 'Get a ${entity.name} by ID' })`,
      "  @ApiParam({ name: 'id', description: 'Unique identifier' })",
      `  @ApiResponse({ status: 200, type: ${entity.name}ResponseDto })`,
      "  findOne(@Param('id') id: string) {",
      '    return this.service.findOne(id);',
      '  }',
      '',
      "  @Patch(':id')",
      `  @ApiOperation({ summary: 'Update an existing ${entity.name}' })`,
      "  @ApiParam({ name: 'id', description: 'Unique identifier' })",
      "  update(@Param('id') id: string, @Body() updateDto: Update${entity.name}Dto) {",
      '    return this.service.update(id, updateDto);',
      '  }',
      '',
      "  @Delete(':id')",
      '  @HttpCode(HttpStatus.NO_CONTENT)',
      `  @ApiOperation({ summary: 'Delete a ${entity.name}' })`,
      "  @ApiParam({ name: 'id', description: 'Unique identifier' })",
      "  remove(@Param('id') id: string) {",
      '    return this.service.remove(id);',
      '  }',
      '}',
    ].join('\n');
  }

  private generateModule(entity: ErEntity): string {
    const kebab = this.toKebabCase(entity.name);
    return [
      "import { Module } from '@nestjs/common';",
      `import { ${entity.name}Service } from './${kebab}.service';`,
      `import { ${entity.name}Controller } from './${kebab}.controller';`,
      "import { PrismaModule } from '../../prisma/prisma.module';",
      '',
      '@Module({',
      '  imports: [PrismaModule],',
      `  controllers: [${entity.name}Controller],`,
      `  providers: [${entity.name}Service],`,
      `  exports: [${entity.name}Service],`,
      '})',
      `export class ${entity.name}Module {}`,
    ].join('\n');
  }

  private generateRootModule(rootModuleName: string, entities: string[]): string {
    const imports = entities.map((e) => {
      const kebab = this.toKebabCase(e);
      return `import { ${e}Module } from './${kebab}/${kebab}.module';`;
    });

    const modules = entities.map((e) => `    ${e}Module,`).join('\n');

    return [
      "import { Module } from '@nestjs/common';",
      ...imports,
      '',
      '@Module({',
      '  imports: [',
      modules,
      '  ],',
      '  exports: [',
      modules,
      '  ],',
      '})',
      `export class ${rootModuleName}Module {}`,
    ].join('\n');
  }

  private generatePrismaSchema(graph: ErGraph): string {
    const lines: string[] = [
      '// This schema was synthesized from Mermaid Architecture Diagrams',
      'datasource db {',
      '  provider = "postgresql"',
      '  url      = env("DATABASE_URL")',
      '}',
      '',
      'generator client {',
      '  provider = "prisma-client-js"',
      '}',
      '',
    ];

    for (const entity of graph.entities.values()) {
      lines.push(`model ${entity.name} {`);

      // Fields
      for (const field of entity.fields) {
        let prismaType = 'String';
        if (field.isId) {
          lines.push(`  ${field.name.padEnd(16)} String   @id @default(uuid())`);
          continue;
        }

        if (field.name === 'createdAt') {
          lines.push(`  ${field.name.padEnd(16)} DateTime @default(now())`);
          continue;
        }
        if (field.name === 'updatedAt') {
          lines.push(`  ${field.name.padEnd(16)} DateTime @updatedAt`);
          continue;
        }

        if (field.type === 'number') prismaType = 'Int';
        else if (field.type === 'boolean') prismaType = 'Boolean';
        else if (field.type === 'Date') prismaType = 'DateTime';
        else if (field.type === 'json') prismaType = 'Json';

        const optionalModifier = field.isRequired ? '' : '?';
        const listModifier = field.isList ? '[]' : '';
        const attributes: string[] = [];

        if (field.isUnique) attributes.push('@unique');

        lines.push(
          `  ${field.name.padEnd(16)} ${prismaType}${listModifier}${optionalModifier} ${attributes.join(' ')}`.trimEnd(),
        );
      }

      // Relations
      for (const rel of entity.relations) {
        if (rel.sourceEntity === entity.name) {
          // Source side of relation
          const target = graph.entities.get(rel.targetEntity);
          if (target) {
            if (rel.type === 'one-to-many') {
              lines.push(`  ${rel.sourceField.padEnd(16)} ${rel.targetEntity}[]`);
            } else if (rel.type === 'one-to-one') {
              lines.push(
                `  ${rel.sourceField.padEnd(16)} ${rel.targetEntity}? @relation("${rel.relationName}", fields: [${rel.sourceField}Id], references: [id])`,
              );
              lines.push(`  ${(rel.sourceField + 'Id').padEnd(16)} String?   @unique`);
            }
          }
        } else if (rel.targetEntity === entity.name) {
          // Target side of relation
          if (rel.type === 'one-to-many') {
            lines.push(
              `  ${rel.targetField.padEnd(16)} ${rel.sourceEntity} @relation(fields: [${rel.targetField}Id], references: [id], onDelete: ${rel.onDelete || 'Cascade'})`,
            );
            lines.push(`  ${(rel.targetField + 'Id').padEnd(16)} String`);
          }
        }
      }

      lines.push('');
      lines.push(`  @@map("${entity.tableName}")`);
      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  private toTsType(field: ErField): string {
    let t = field.type;
    if (t === 'Date') t = 'Date';
    if (field.isList) t = `${t}[]`;
    return t;
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}
