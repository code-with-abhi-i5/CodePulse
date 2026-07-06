import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/challenges.dto';

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get all active challenges' })
  async getActiveChallenges() {
    return this.challengesService.getActiveChallenges();
  }

  @Get('user/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get challenges for current user' })
  async getMyChallenges() {
    const mockUserId = '123';
    return this.challengesService.getUserChallenges(mockUserId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new challenge (Admin)' })
  async createChallenge(@Body() dto: CreateChallengeDto) {
    return this.challengesService.createChallenge(dto);
  }
}
