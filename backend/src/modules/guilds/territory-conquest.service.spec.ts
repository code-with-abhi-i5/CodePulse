import { TerritoryConquestService } from './territory-conquest.service';

describe('TerritoryConquestService (16 Tech Nodes, Conquest Points, Season Reset & Clan Chat)', () => {
  let service: TerritoryConquestService;

  beforeEach(() => {
    service = new TerritoryConquestService();
  });

  it('initializes all 16 regional tech nodes including TypeScript Citadel, Rust Frontier & Postgres Bastion', () => {
    const nodes = service.getAllTerritoryNodes();
    expect(nodes).toHaveLength(16);
    expect(nodes.some((n) => n.name === 'TypeScript Citadel')).toBe(true);
    expect(nodes.some((n) => n.name === 'Rust Frontier')).toBe(true);
    expect(nodes.some((n) => n.name === 'Postgres Bastion')).toBe(true);
  });

  it('accumulates conquest points from battle victories and merged PRs, captures nodes, and distributes weekly season rewards', async () => {
    service.recordConquestContribution({
      nodeKey: 'ts-citadel',
      guildId: 'guild-wce',
      guildName: 'WCE Compilers',
      source: 'BATTLE_VICTORY',
      points: 60,
    });

    const captured = service.recordConquestContribution({
      nodeKey: 'ts-citadel',
      guildId: 'guild-wce',
      guildName: 'WCE Compilers',
      source: 'MERGED_PR',
      points: 90,
    });

    expect(captured.ownerGuildId).toBe('guild-wce');
    expect(captured.conquestPoints).toBe(150);

    service.upsertRosterMember('guild-wce', {
      userId: 'u-1',
      username: 'Itssonia7',
      role: 'LEADER',
      contributedPoints: 150,
    });
    expect(service.getGuildRoster('guild-wce')).toHaveLength(1);

    service.postClanChatMessage({
      guildId: 'guild-wce',
      senderId: 'u-1',
      senderName: 'Itssonia7',
      message: 'Hold TypeScript Citadel before weekly reset!',
    });
    expect(service.getClanChat('guild-wce')).toHaveLength(1);

    const resetSummary = await service.executeWeeklySeasonReset();
    expect(resetSummary.previousSeasonNumber).toBe(1);
    expect(resetSummary.seasonNumber).toBe(2);
    expect(resetSummary.standings[0].guildId).toBe('guild-wce');
    expect(resetSummary.standings[0].trophiesAwarded).toBeGreaterThan(0);
    expect(resetSummary.standings[0].treasuryCoins).toBeGreaterThan(0);

    // Active conquest scores reset for new season
    expect(service.getAllTerritoryNodes()[0].conquestPoints).toBe(0);
  });
});
