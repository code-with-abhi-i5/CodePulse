import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RepositoriesService } from './repositories.service';
import { QueryRepositoriesDto } from './dto/repositories.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('repositories')
@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get paginated repositories for the authenticated user with filtering and sorting',
  })
  async getRepositories(
    @Request() req: any,
    @Query() query: QueryRepositoriesDto,
  ) {
    return this.repositoriesService.getRepositories(req.user.id, query);
  }

  @Get('languages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get distinct programming languages for the authenticated user',
  })
  async getUserLanguages(@Request() req: any) {
    return this.repositoriesService.getUserLanguages(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get repository details by ID' })
  async getRepositoryById(@Request() req: any, @Param('id') id: string) {
    return this.repositoriesService.getRepositoryById(req.user.id, id);
  }

  @Post(':id/sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Trigger on-demand synchronization for a specific repository',
  })
  async syncRepository(@Request() req: any, @Param('id') id: string) {
    return this.repositoriesService.syncRepository(req.user.id, id);
  }
}
