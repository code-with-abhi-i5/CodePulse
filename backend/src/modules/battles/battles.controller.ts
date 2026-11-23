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
  UseInterceptors,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Idempotent } from '../../common/idempotency/idempotent.decorator';
import { IdempotencyInterceptor } from '../../common/idempotency/idempotency.interceptor';
import { BattlesService } from './battles.service';
import { CreateBattleDto, UpdateBattleStatusDto } from './dto/battles.dto';
import { SeasonResetService } from './season-reset.service';
import { ReplayStreamService } from './replay-stream.service';
import { ReplayEngineService } from './replay-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Optional } from '@nestjs/common';
import { SabotageEngineService, SABOTAGE_POWERUPS } from './sabotage-engine.service';
import { EdgeRelayService } from './edge-relay.service';
import { RouteEdgeDto, LatencyProbeDto } from './dto/edge-relay.dto';
import { RoomService, CreatePrivateRoomDto } from './room.service';

@ApiTags('battles')
@Controller('battles')
export class BattlesController {
  constructor(
    private readonly battlesService: BattlesService,
    private readonly seasonReset: SeasonResetService,
    private readonly replayStream: ReplayStreamService,
    @Optional() private readonly replayEngine?: ReplayEngineService,
    @Optional() private readonly sabotageEngine?: SabotageEngineService,
    @Optional() private readonly edgeRelay?: EdgeRelayService,
    @Optional() private readonly roomService?: RoomService,
  ) {}

  @Get('edge/regions')
  @ApiOperation({ summary: 'Get available multi-region WebSocket edge POPs (US-East, EU-Central, AP-South)' })
  getEdgeRegions() {
    return this.edgeRelay ? this.edgeRelay.getAllRegions() : [];
  }

  @Post('edge/route')
  @ApiOperation({ summary: 'Resolve optimal nearest edge gateway via Geo-DNS / Anycast heuristics' })
  routeEdgeClient(@Body() dto: RouteEdgeDto) {
    if (!this.edgeRelay) throw new BadRequestException('Edge Relay service unavailable');
    return this.edgeRelay.resolveOptimalEdge(dto);
  }

  @Get('edge/telemetry')
  @ApiOperation({ summary: 'Get continuous inter-region network link telemetry, packet loss and average RTT' })
  getEdgeTelemetry() {
    if (!this.edgeRelay) throw new BadRequestException('Edge Relay service unavailable');
    return this.edgeRelay.getNetworkSummary();
  }

  @Post('edge/latency-probe')
  @ApiOperation({ summary: 'Record player latency probe and update dynamic equalization buffer' })
  recordLatencyProbe(@Body() dto: LatencyProbeDto) {
    if (!this.edgeRelay) throw new BadRequestException('Edge Relay service unavailable');
    return this.edgeRelay.recordPlayerPing(
      dto.battleId,
      dto.userId,
      dto.measuredRttMs,
      dto.region as any,
    );
  }

  @Get(':battleId/edge/latency')
  @ApiOperation({ summary: 'Get normalized latency profiles and applied buffers for players in a battle' })
  getBattleLatencyProfiles(@Param('battleId') battleId: string) {
    if (!this.edgeRelay) return [];
    return this.edgeRelay.getBattleLatencyProfiles(battleId);
  }

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
  @ApiOperation({ summary: 'Get full battle replay session with 5s snapshots, diffs, and timeline markers' })
  async getBattleReplay(
    @Param('id') id: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('limit') limit?: string,
    @Query('legacy') legacy?: string,
  ) {
    if (legacy === 'true' && this.replayStream) {
      const start = startTime ? new Date(startTime) : undefined;
      const end = endTime ? new Date(endTime) : undefined;
      const max = limit ? parseInt(limit, 10) : 10000;
      return this.replayStream.getMatchReplayTimeline(id, start, end, max);
    }
    if (this.replayEngine) {
      return this.replayEngine.getReplay(id);
    }
    return this.replayStream.getMatchReplayTimeline(id);
  }

  @Get(':id/replay/stream')
  @ApiOperation({ summary: 'Stream compressed binary replay blob with chunked transfer encoding' })
  async streamBattleReplay(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    if (!this.replayEngine) {
      throw new BadRequestException('ReplayEngineService is unavailable');
    }
    const session = await this.replayEngine.getReplay(id);
    const compressedBuffer = this.replayEngine.compressSession(session);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Battle-Duration-Ms', String(session.metadata.durationMs));
    res.setHeader('X-Battle-Total-Snapshots', String(session.snapshots.length));
    res.setHeader('X-Battle-Total-Actions', String(session.actions.length));

    // Stream chunked buffer
    const chunkSize = 16384; // 16KB chunks
    for (let offset = 0; offset < compressedBuffer.length; offset += chunkSize) {
      const slice = compressedBuffer.subarray(offset, offset + chunkSize);
      res.write(slice);
    }
    res.end();
  }

  @Get(':id/replay/seek')
  @ApiOperation({ summary: 'Query instantaneous seek state for a given timestamp in ms' })
  async seekBattleReplay(
    @Param('id') id: string,
    @Query('timestamp', ParseIntPipe) timestamp: number,
  ) {
    if (!this.replayEngine) {
      throw new BadRequestException('ReplayEngineService is unavailable');
    }
    const session = await this.replayEngine.getReplay(id);
    return this.replayEngine.seekState(session, timestamp);
  }

  @Post('rooms/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a private battle room with custom ruleset and 6-char code' })
  async createPrivateRoom(@Request() req: any, @Body() dto: Partial<CreatePrivateRoomDto>) {
    if (!this.roomService) throw new BadRequestException('RoomService is unavailable');
    return this.roomService.createPrivateRoom({
      hostId: req.user?.id || dto.hostId || 'anonymous',
      hostUsername: req.user?.username || dto.hostUsername || 'Host',
      difficulty: dto.difficulty,
      allowedLanguages: dto.allowedLanguages,
      timeLimitSeconds: dto.timeLimitSeconds,
      maxSpectators: dto.maxSpectators,
      passcode: dto.passcode,
      customRoomCode: dto.customRoomCode,
    });
  }

  @Get('rooms/:roomCode')
  @ApiOperation({ summary: 'Get public / spectator info for private room' })
  async getPrivateRoom(@Param('roomCode') roomCode: string) {
    if (!this.roomService) throw new BadRequestException('RoomService is unavailable');
    const info = await this.roomService.getSpectatorRoomInfo(roomCode);
    if (!info) throw new BadRequestException(`Private room ${roomCode} not found or expired`);
    return info;
  }

  @Post('rooms/:roomCode/validate-passcode')
  @ApiOperation({ summary: 'Validate passcode for private room before joining' })
  async validateRoomPasscode(
    @Param('roomCode') roomCode: string,
    @Body() body: { passcode: string },
  ) {
    if (!this.roomService) throw new BadRequestException('RoomService is unavailable');
    const room = await this.roomService.getRoom(roomCode);
    if (!room) throw new BadRequestException(`Private room ${roomCode} not found`);
    if (!room.hasPasscode) return { valid: true, requiresPasscode: false };
    const valid = this.roomService.verifyPasscode(body.passcode, room.passcodeHash || '');
    return { valid, requiresPasscode: true };
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(IdempotencyInterceptor)
  @Idempotent({ lifetimeSeconds: 120, enforceHeader: false })
  @ApiOperation({ summary: 'Submit solution for battle with RFC 9457 idempotency deduplication guard' })
  async submitBattleSolution(
    @Request() req: any,
    @Body() dto: { battleId: string; code: string; language?: string },
  ) {
    return {
      success: true,
      battleId: dto.battleId,
      userId: req.user?.id || 'anonymous',
      submittedAt: new Date().toISOString(),
    };
  }

  @Post('matchmaking/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(IdempotencyInterceptor)
  @Idempotent({ lifetimeSeconds: 60, enforceHeader: false })
  @ApiOperation({ summary: 'Join matchmaking pool with idempotency deduplication guard' })
  async joinMatchmaking(
    @Request() req: any,
    @Body() dto: { category?: string; language?: string },
  ) {
    return {
      queued: true,
      userId: req.user?.id || 'anonymous',
      category: dto.category || 'General',
      queueTicket: `ticket_${Date.now()}`,
    };
  }

  @Get(':id/plagiarism')
  @ApiOperation({ summary: 'Get plagiarism inspection report, similarity scores, and diff overlays for a battle' })
  async getPlagiarismReport(@Param('id') id: string) {
    return this.battlesService.getPlagiarismReport(id);
  }

  @Post(':id/check-plagiarism')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run automated AST Winnowing plagiarism and similarity detection analysis on a submission' })
  async checkBattlePlagiarism(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: {
      code: string;
      language?: string;
      opponentCode?: string;
      opponentUserId?: string;
      standardTemplate?: string;
    },
  ) {
    return this.battlesService.checkPlagiarism(
      id,
      req.user?.id || 'anonymous',
      dto.code,
      dto.language,
      dto.opponentCode,
      dto.opponentUserId,
      dto.standardTemplate,
    );
  }
}
