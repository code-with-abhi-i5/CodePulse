import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TerritoryNodeState {
  nodeKey: string;
  name: string;
  region: string;
  topicTag: string;
  hexQ: number;
  hexR: number;
  ownerGuildId: string | null;
  ownerGuildName: string | null;
  defensePoints: number;
  conquestPoints: number;
  guildScores: Record<string, { guildName: string; points: number }>;
}

export interface GuildRosterMember {
  userId: string;
  username: string;
  role: 'LEADER' | 'OFFICER' | 'MEMBER';
  contributedPoints: number;
}

export interface ClanChatEntry {
  id: string;
  guildId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestampIso: string;
}

export interface SeasonResetSummary {
  seasonNumber: number;
  previousSeasonNumber: number;
  standings: Array<{
    guildId: string;
    guildName: string;
    controlledNodes: number;
    totalPoints: number;
    trophiesAwarded: number;
    treasuryCoins: number;
  }>;
  resetAtIso: string;
}

const INITIAL_16_TERRITORY_NODES: Array<{
  nodeKey: string;
  name: string;
  region: string;
  topicTag: string;
  hexQ: number;
  hexR: number;
}> = [
  { nodeKey: 'ts-citadel', name: 'TypeScript Citadel', region: 'Frontend Core', topicTag: 'typescript', hexQ: 0, hexR: 0 },
  { nodeKey: 'rust-frontier', name: 'Rust Frontier', region: 'Systems Frontier', topicTag: 'rust', hexQ: 1, hexR: 0 },
  { nodeKey: 'postgres-bastion', name: 'Postgres Bastion', region: 'Data Stronghold', topicTag: 'postgres', hexQ: 0, hexR: 1 },
  { nodeKey: 'go-foundry', name: 'Go Concurrency Foundry', region: 'Systems Frontier', topicTag: 'go', hexQ: 2, hexR: 0 },
  { nodeKey: 'react-spire', name: 'React UI Spire', region: 'Frontend Core', topicTag: 'react', hexQ: -1, hexR: 1 },
  { nodeKey: 'next-harbor', name: 'Next.js Edge Harbor', region: 'Frontend Core', topicTag: 'nextjs', hexQ: -1, hexR: 0 },
  { nodeKey: 'prisma-vault', name: 'Prisma Schema Vault', region: 'Data Stronghold', topicTag: 'prisma', hexQ: 1, hexR: 1 },
  { nodeKey: 'redis-outpost', name: 'Redis Cache Outpost', region: 'Data Stronghold', topicTag: 'redis', hexQ: -2, hexR: 1 },
  { nodeKey: 'llm-sanctum', name: 'LLM Inference Sanctum', region: 'AI Citadel', topicTag: 'ai', hexQ: 0, hexR: -1 },
  { nodeKey: 'rag-observatory', name: 'Vector RAG Observatory', region: 'AI Citadel', topicTag: 'rag', hexQ: 1, hexR: -1 },
  { nodeKey: 'docker-dockyard', name: 'Docker Container Dockyard', region: 'Cloud & Infra', topicTag: 'docker', hexQ: 2, hexR: -1 },
  { nodeKey: 'k8s-skybridge', name: 'Kubernetes Skybridge', region: 'Cloud & Infra', topicTag: 'kubernetes', hexQ: -1, hexR: -1 },
  { nodeKey: 'wasm-atelier', name: 'WebAssembly Atelier', region: 'Systems Frontier', topicTag: 'wasm', hexQ: 2, hexR: -2 },
  { nodeKey: 'graphql-gate', name: 'GraphQL Federation Gate', region: 'API Ridge', topicTag: 'graphql', hexQ: -2, hexR: 0 },
  { nodeKey: 'grpc-beacon', name: 'gRPC Mesh Beacon', region: 'API Ridge', topicTag: 'grpc', hexQ: -2, hexR: 2 },
  { nodeKey: 'sec-palisade', name: 'Zero-Trust Security Palisade', region: 'Cloud & Infra', topicTag: 'security', hexQ: 1, hexR: -2 },
];

@Injectable()
export class TerritoryConquestService {
  private readonly logger = new Logger(TerritoryConquestService.name);
  private readonly nodes = new Map<string, TerritoryNodeState>();
  private readonly rosters = new Map<string, GuildRosterMember[]>();
  private readonly chatByGuild = new Map<string, ClanChatEntry[]>();
  private readonly guildTreasury = new Map<string, { guildName: string; trophies: number; coins: number }>();
  private seasonNumber = 1;

  constructor(@Optional() private readonly prisma?: PrismaService) {
    this.seedNodes();
  }

  private seedNodes(): void {
    this.nodes.clear();
    for (const def of INITIAL_16_TERRITORY_NODES) {
      this.nodes.set(def.nodeKey, {
        ...def,
        ownerGuildId: null,
        ownerGuildName: null,
        defensePoints: 100,
        conquestPoints: 0,
        guildScores: {},
      });
    }
  }

  getAllTerritoryNodes(): TerritoryNodeState[] {
    return Array.from(this.nodes.values());
  }

  getSeasonNumber(): number {
    return this.seasonNumber;
  }

  /**
   * Awards conquest points from battle victories (default 50 pts) or merged PRs
   * (default 75 pts) on matching topics, recalculating node ownership and defense.
   */
  recordConquestContribution(params: {
    nodeKey: string;
    guildId: string;
    guildName: string;
    source: 'BATTLE_VICTORY' | 'MERGED_PR';
    points?: number;
  }): TerritoryNodeState {
    const node = this.nodes.get(params.nodeKey);
    if (!node) {
      throw new Error(`Unknown territory node: ${params.nodeKey}`);
    }

    const basePoints =
      params.points ?? (params.source === 'MERGED_PR' ? 75 : 50);

    const existing = node.guildScores[params.guildId] ?? {
      guildName: params.guildName,
      points: 0,
    };
    existing.guildName = params.guildName;
    existing.points += basePoints;
    node.guildScores[params.guildId] = existing;
    node.conquestPoints += basePoints;

    // Determine highest-scoring guild for this territory
    let topGuildId: string | null = null;
    let topGuildName: string | null = null;
    let maxPts = 0;

    for (const [gId, info] of Object.entries(node.guildScores)) {
      if (info.points > maxPts) {
        maxPts = info.points;
        topGuildId = gId;
        topGuildName = info.guildName;
      }
    }

    if (topGuildId && topGuildId !== node.ownerGuildId) {
      node.ownerGuildId = topGuildId;
      node.ownerGuildName = topGuildName;
      node.defensePoints = Math.max(100, Math.round(maxPts * 0.5));
    } else if (topGuildId && topGuildId === node.ownerGuildId) {
      node.defensePoints += Math.round(basePoints * 0.4);
    }

    this.ensureTreasuryEntry(params.guildId, params.guildName);
    return node;
  }

  private ensureTreasuryEntry(guildId: string, guildName: string) {
    if (!this.guildTreasury.has(guildId)) {
      this.guildTreasury.set(guildId, { guildName, trophies: 0, coins: 250 });
    }
  }

  /**
   * Weekly cron / season transition: tallies controlled nodes & points, distributes
   * trophies and guild treasury coins, and resets active conquest scores for next season.
   */
  async executeWeeklySeasonReset(): Promise<SeasonResetSummary> {
    const previousSeasonNumber = this.seasonNumber;
    const controlledCountByGuild = new Map<string, { guildName: string; nodes: number; points: number }>();

    for (const node of this.nodes.values()) {
      for (const [gId, info] of Object.entries(node.guildScores)) {
        const entry = controlledCountByGuild.get(gId) ?? {
          guildName: info.guildName,
          nodes: 0,
          points: 0,
        };
        entry.points += info.points;
        if (node.ownerGuildId === gId) {
          entry.nodes += 1;
        }
        controlledCountByGuild.set(gId, entry);
      }
    }

    const standings = Array.from(controlledCountByGuild.entries())
      .map(([guildId, stat]) => {
        const trophiesAwarded = stat.nodes * 3 + Math.floor(stat.points / 150);
        const treasuryCoins = stat.nodes * 200 + stat.points * 2;
        const tre = this.guildTreasury.get(guildId) ?? {
          guildName: stat.guildName,
          trophies: 0,
          coins: 250,
        };
        tre.trophies += trophiesAwarded;
        tre.coins += treasuryCoins;
        this.guildTreasury.set(guildId, tre);

        return {
          guildId,
          guildName: stat.guildName,
          controlledNodes: stat.nodes,
          totalPoints: stat.points,
          trophiesAwarded,
          treasuryCoins,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);

    this.seasonNumber += 1;
    this.seedNodes();

    if (this.prisma && (this.prisma as any).guildSeasonRecord?.createMany && standings.length > 0) {
      await (this.prisma as any).guildSeasonRecord.createMany({
        data: standings.map((s) => ({
          seasonNumber: previousSeasonNumber,
          guildId: s.guildId,
          guildName: s.guildName,
          controlledNodes: s.controlledNodes,
          totalPoints: s.totalPoints,
          trophiesAwarded: s.trophiesAwarded,
          treasuryCoins: s.treasuryCoins,
        })),
      });
    }

    const summary: SeasonResetSummary = {
      seasonNumber: this.seasonNumber,
      previousSeasonNumber,
      standings,
      resetAtIso: new Date().toISOString(),
    };

    this.logger.log(`Completed season ${previousSeasonNumber} -> ${this.seasonNumber} reset`);
    return summary;
  }

  getGuildRoster(guildId: string): GuildRosterMember[] {
    return this.rosters.get(guildId) ?? [];
  }

  upsertRosterMember(guildId: string, member: GuildRosterMember): GuildRosterMember[] {
    const list = this.rosters.get(guildId) ?? [];
    const idx = list.findIndex((m) => m.userId === member.userId);
    if (idx >= 0) {
      list[idx] = member;
    } else {
      list.push(member);
    }
    this.rosters.set(guildId, list);
    return list;
  }

  getClanChat(guildId: string): ClanChatEntry[] {
    return this.chatByGuild.get(guildId) ?? [];
  }

  postClanChatMessage(params: {
    guildId: string;
    senderId: string;
    senderName: string;
    message: string;
  }): ClanChatEntry {
    const entry: ClanChatEntry = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      guildId: params.guildId,
      senderId: params.senderId,
      senderName: params.senderName,
      message: params.message.trim(),
      timestampIso: new Date().toISOString(),
    };
    const list = this.chatByGuild.get(params.guildId) ?? [];
    list.push(entry);
    this.chatByGuild.set(params.guildId, list);
    return entry;
  }

  getGuildTreasury(guildId: string) {
    return this.guildTreasury.get(guildId) ?? { guildName: guildId, trophies: 0, coins: 250 };
  }
}
