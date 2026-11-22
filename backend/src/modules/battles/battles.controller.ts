import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  BadRequestException,
  ForbiddenException,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BattlesService } from './battles.service';
import { CreateBattleDto, UpdateBattleStatusDto } from './dto/battles.dto';
import { SeasonResetService } from './season-reset.service';
import { ReplayStreamService } from './replay-stream.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Optional } from '@nestjs/common';
import { SabotageEngineService, SABOTAGE_POWERUPS } from './sabotage-engine.service';

@ApiTags('battles')
@Controller('battles')
export class BattlesController {
  constructor(
    private readonly battlesService: BattlesService,
    private readonly seasonReset: SeasonResetService,
    private readonly replayStream: ReplayStreamService,
    @Optional() private readonly sabotageEngine?: SabotageEngineService,
  ) {}

  @Get('sabotage/catalog')
  @ApiOperation({ summary: 'Get available Red-Team vs Blue-Team battle sabotage powerups catalog' })
  getSabotageCatalog() {
    return SABOTAGE_POWERUPS;
  }

  @Get(':battleId/sabotage/:userId')
  @ApiOperation({ summary: 'Get player battle sabotage state, active effects, and powerup points' })
  getPlayerSabotageState(
    @Param('battleId') battleId: string,
    @Param('userId') userId: string,
  ) {
    if (!this.sabotageEngine) return null;
    return this.sabotageEngine.getOrCreatePlayerState(battleId, userId);
  }

  @Get(':battleId/sabotage-audit')
  @ApiOperation({ summary: 'Get match sabotage event audit logs for anti-cheat and replay review' })
  getBattleSabotageAudit(@Param('battleId') battleId: string) {
    if (!this.sabotageEngine) return [];
    return this.sabotageEngine.getAuditLogs(battleId);
  }

  @Get('season/leaderboard')
  @ApiOperation({
    summary: 'Competitive rankings (hide MMR during placements)',
  })
  async getSeasonLeaderboard() {
    await this.seasonReset.rolloverIfDue();
    return this.seasonReset.getLeaderboard();
  }

  @Get('season/history/:number')
  @ApiOperation({ summary: 'Archived standings for a completed season' })
  getSeasonHistory(@Param('number', ParseIntPipe) number: number) {
    return this.seasonReset.getArchive(number);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active global battles' })
  async getActiveBattles() {
    return this.battlesService.getActiveBattles();
  }

  @Get('head-to-head')
  @ApiOperation({
    summary: 'Get completed head-to-head battles for two GitHub usernames',
  })
  async getHeadToHead(
    @Query('user1') user1?: string,
    @Query('user2') user2?: string,
  ) {
    const validUsername = (value?: string) =>
      !!value && /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(value);
    if (
      !validUsername(user1) ||
      !validUsername(user2) ||
      user1!.toLowerCase() === user2!.toLowerCase()
    ) {
      throw new BadRequestException(
        'Two distinct GitHub usernames are required',
      );
    }
    return this.battlesService.getHeadToHead(user1!, user2!);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get battles for a specific user' })
  async getUserBattles(@Param('userId') userId: string) {
    return this.battlesService.getUserBattles(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Challenge a user to a battle' })
  async createBattle(@Request() req: any, @Body() dto: CreateBattleDto) {
    if (req.user?.id && dto.challengerId && req.user.id !== dto.challengerId) {
      throw new ForbiddenException('Cannot challenge on behalf of another user');
    }
    return this.battlesService.createBattle(dto);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Update battle status (e.g., mark as completed, expired, or forfeited)',
  })
  async updateBattleStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBattleStatusDto,
  ) {
    return this.battlesService.updateBattleStatus(id, dto, req.user?.id);
  }

  @Post(':id/forfeit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Forfeit an active battle' })
  async forfeitBattle(@Request() req: any, @Param('id') id: string) {
    return this.battlesService.forfeitBattle(id, req.user.id);
  }

  @Get(':id/replay')
  @ApiOperation({ summary: 'Get high-frequency keystroke match replay timeline from ScyllaDB' })
  async getBattleReplay(
    @Param('id') id: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('limit') limit?: string,
  ) {
    const start = startTime ? new Date(startTime) : undefined;
    const end = endTime ? new Date(endTime) : undefined;
    const max = limit ? parseInt(limit, 10) : 10000;
    return this.replayStream.getMatchReplayTimeline(id, start, end, max);
  }
}
