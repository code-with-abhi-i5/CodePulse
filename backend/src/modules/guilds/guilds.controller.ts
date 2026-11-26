import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GuildsService } from './guilds.service';
import { TerritoryConquestService } from './territory-conquest.service';
import { CreateGuildDto, UpdateMemberRoleDto } from './dto/guilds.dto';

@ApiTags('guilds')
@Controller('guilds')
export class GuildsController {
  constructor(
    private readonly guildsService: GuildsService,
    private readonly territoryConquest?: TerritoryConquestService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new developer guild' })
  async createGuild(@Req() req: any, @Body() dto: CreateGuildDto) {
    const userId = req.user?.id || 'mock-user-id';
    return this.guildsService.createGuild(userId, dto);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get guild profile and members roster by slug' })
  async getGuildBySlug(@Param('slug') slug: string) {
    return this.guildsService.getGuildBySlug(slug);
  }

  @Post(':id/join')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a public guild or use invite code' })
  async joinGuild(@Param('id') id: string, @Req() req: any, @Body() body: { inviteCode?: string }) {
    const userId = req.user?.id || 'mock-user-id';
    return this.guildsService.joinGuild(id, userId, body?.inviteCode);
  }

  @Patch(':id/members/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Promote or demote guild member' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Req() req: any,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const actorId = req.user?.id || 'mock-user-id';
    return this.guildsService.updateMemberRole(id, actorId, targetUserId, dto);
  }

  @Delete(':id/members/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kick or remove a member from guild' })
  async kickMember(@Param('id') id: string, @Param('userId') targetUserId: string, @Req() req: any) {
    const actorId = req.user?.id || 'mock-user-id';
    return this.guildsService.kickMember(id, actorId, targetUserId);
  }

  @Get('territories/map')
  @ApiOperation({ summary: 'Get 16 regional tech territory nodes for conquest map' })
  getTerritoryMap() {
    const svc = this.territoryConquest ?? new TerritoryConquestService();
    return { season: svc.getSeasonNumber(), nodes: svc.getAllTerritoryNodes() };
  }

  @Post('territories/conquest')
  @ApiOperation({ summary: 'Record conquest points from battle victory or merged PR' })
  recordConquest(@Body() body: any) {
    const svc = this.territoryConquest ?? new TerritoryConquestService();
    return svc.recordConquestContribution(body);
  }

  @Post('seasons/reset')
  @ApiOperation({ summary: 'Execute weekly season reset and distribute guild trophies & treasury' })
  async resetSeason() {
    const svc = this.territoryConquest ?? new TerritoryConquestService();
    return svc.executeWeeklySeasonReset();
  }

  @Get(':guildId/roster')
  @ApiOperation({ summary: 'Get guild roster members' })
  getRoster(@Param('guildId') guildId: string) {
    const svc = this.territoryConquest ?? new TerritoryConquestService();
    return svc.getGuildRoster(guildId);
  }

  @Post(':guildId/roster')
  @ApiOperation({ summary: 'Add or update a guild roster member' })
  upsertRoster(@Param('guildId') guildId: string, @Body() body: any) {
    const svc = this.territoryConquest ?? new TerritoryConquestService();
    return svc.upsertRosterMember(guildId, body);
  }

  @Get(':guildId/chat')
  @ApiOperation({ summary: 'Get guild clan chat messages' })
  getChat(@Param('guildId') guildId: string) {
    const svc = this.territoryConquest ?? new TerritoryConquestService();
    return svc.getClanChat(guildId);
  }

  @Post(':guildId/chat')
  @ApiOperation({ summary: 'Post a message to guild clan chat' })
  postChat(@Param('guildId') guildId: string, @Body() body: any) {
    const svc = this.territoryConquest ?? new TerritoryConquestService();
    return svc.postClanChatMessage({ guildId, ...body });
  }
}
