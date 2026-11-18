import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/challenges.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get challenges for current authenticated user' })
  async getMyChallenges(@Request() req: any) {
    return this.challengesService.getUserChallenges(req.user.id);
  }

  @Post(':id/claim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim XP reward for a completed challenge' })
  async claimChallenge(@Request() req: any, @Param('id') challengeId: string) {
    return this.challengesService.claimChallengeReward(
      req.user.id,
      challengeId,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new challenge (Admin)' })
  async createChallenge(@Body() dto: CreateChallengeDto) {
    return this.challengesService.createChallenge(dto);
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger generation of daily challenges (Admin/Dev)' })
  async triggerDailyChallenges() {
    await this.challengesService.generateDailyChallenges();
    return { success: true, message: 'Daily challenges generated' };
  }
}
