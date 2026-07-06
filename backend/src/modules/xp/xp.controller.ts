import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { XpService } from './xp.service';
import { AddXpDto } from './dto/xp.dto';

@ApiTags('xp')
@Controller('xp')
export class XpController {
  constructor(private readonly xpService: XpService) {}

  @Post('add')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add XP to a user (Admin/Internal System only)' })
  async addXp(@Body() dto: AddXpDto) {
    return this.xpService.addXp(dto);
  }
}
