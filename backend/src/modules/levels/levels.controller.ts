import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LevelsService } from './levels.service';

@ApiTags('levels')
@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Post('check/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user meets criteria for level up and apply if true' })
  async checkLevelUp(@Param('userId') userId: string) {
    return this.levelsService.checkAndLevelUp(userId);
  }
}
