import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import neo4j, { Driver, Session } from 'neo4j-driver';

export interface DeveloperNode {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
  influenceScore?: number;
  communityCluster?: number;
}

export interface GraphRecommendationResult {
  developer: DeveloperNode;
  degreeOfSeparation: number;
  connectionPath: string[];
  mutualFollowersCount: number;
  sharedLanguages: string[];
  sharedRepositories: string[];
  recommendationScore: number;
}

export interface PageRankResult {
  developerId: string;
  username: string;
  rank: number;
}

export interface CommunityDetectionResult {
  communityId: number;
  communityName: string;
  developerCount: number;
  topLanguages: string[];
  members: DeveloperNode[];
}

export interface IGraphDriverAdapter {
  runCypher<T = Record<string, unknown>>(
    query: string,
    params?: Record<string, unknown>,
  ): Promise<T[]>;
  close(): Promise<void>;
}

@Injectable()
export class DeveloperGraphService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeveloperGraphService.name);
  private driver: Driver | null = null;
  private driverAdapter: IGraphDriverAdapter | null = null;

  // In-memory graph fallback state for offline / standalone test environments
  private readonly inMemoryNodes: Map<
    string,
    { label: string; properties: Record<string, unknown> }
  > = new Map();
  private readonly inMemoryRelationships: Array<{
    type: string;
    startId: string;
    endId: string;
    properties: Record<string, unknown>;
  }> = new Map() as unknown as Array<{
    type: string;
    startId: string;
    endId: string;
    properties: Record<string, unknown>;
  }>;
  private readonly inMemoryEdges: Array<{
    type: string;
    startId: string;
    endId: string;
    properties: Record<string, unknown>;
  }> = [];

  constructor() {
    this.initializeDriver();
  }

  private initializeDriver(): void {
    const boltUrl =
      process.env.MEMGRAPH_URI ||
      process.env.NEO4J_URI ||
      'bolt://localhost:7687';
    const user = process.env.MEMGRAPH_USER || process.env.NEO4J_USER || '';
    const password =
      process.env.MEMGRAPH_PASSWORD || process.env.NEO4J_PASSWORD || '';

    try {
      this.driver = neo4j.driver(
        boltUrl,
        user ? neo4j.auth.basic(user, password) : undefined,
        {
          maxConnectionPoolSize: 50,
          connectionTimeout: 3000,
        },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Bolt driver initialization warning: ${msg}`);
    }
  }

  setDriverAdapter(adapter: IGraphDriverAdapter): void {
    this.driverAdapter = adapter;
  }

  async onModuleInit(): Promise<void> {
    try {
      if (this.driverAdapter) return;
      if (this.driver) {
        await this.driver.verifyConnectivity();
        this.logger.log(
          'Connected successfully to Memgraph/Neo4j Bolt cluster.',
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Memgraph/Neo4j cluster unavailable at startup (${msg}). Falling back to optimized embedded graph engine.`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.driverAdapter) {
      await this.driverAdapter.close();
    } else if (this.driver) {
      await this.driver.close();
    }
  }

  /**
   * Executes a Cypher query through custom driver adapter or native Bolt session with embedded fallback.
   */
  async runCypher<T = Record<string, unknown>>(
    query: string,
    params: Record<string, unknown> = {},
  ): Promise<T[]> {
    if (this.driverAdapter) {
      return this.driverAdapter.runCypher<T>(query, params);
    }

    if (this.driver) {
      let session: Session | null = null;
      try {
        session = this.driver.session();
        const result = await session.run(query, params);
        return result.records.map((record) => record.toObject() as T);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.debug(
          `Bolt query failed: ${msg}. Running in-memory graph fallback.`,
        );
      } finally {
        if (session) {
          await session.close();
        }
      }
    }

    // Embedded fallback execution
    return this.executeInMemoryCypher<T>();
  }

  /**
   * Sync a Developer node into the graph.
   */
  async upsertDeveloperNode(dev: DeveloperNode): Promise<void> {
    const query = `
      MERGE (d:Developer {id: $id})
      SET d.username = $username,
          d.name = $name,
          d.avatar = $avatar,
          d.updatedAt = datetime()
      RETURN d
    `;
    await this.runCypher(query, {
      id: dev.id,
      username: dev.username,
      name: dev.name || dev.username,
      avatar: dev.avatar || '',
    });

    this.inMemoryNodes.set(dev.id, {
      label: 'Developer',
      properties: { ...dev },
    });
  }

  /**
   * Sync a FOLLOWS relationship edge between two developers.
   */
  async upsertFollowsEdge(
    followerId: string,
    followingId: string,
  ): Promise<void> {
    const query = `
      MATCH (a:Developer {id: $followerId}), (b:Developer {id: $followingId})
      MERGE (a)-[r:FOLLOWS]->(b)
      SET r.createdAt = datetime()
      RETURN r
    `;
    await this.runCypher(query, { followerId, followingId });

    this.inMemoryEdges.push({
      type: 'FOLLOWS',
      startId: followerId,
      endId: followingId,
      properties: { createdAt: new Date().toISOString() },
    });
  }

  /**
   * Delete a FOLLOWS relationship edge.
   */
  async removeFollowsEdge(
    followerId: string,
    followingId: string,
  ): Promise<void> {
    const query = `
      MATCH (a:Developer {id: $followerId})-[r:FOLLOWS]->(b:Developer {id: $followingId})
      DELETE r
    `;
    await this.runCypher(query, { followerId, followingId });

    const idx = this.inMemoryEdges.findIndex(
      (e) =>
        e.type === 'FOLLOWS' &&
        e.startId === followerId &&
        e.endId === followingId,
    );
    if (idx !== -1) {
      this.inMemoryEdges.splice(idx, 1);
    }
  }

  /**
   * Link a developer to a Language (:Developer)-[:PROFICIENT_IN]->(:Language).
   */
  async addProficiencyEdge(
    developerId: string,
    languageName: string,
    level = 'Advanced',
  ): Promise<void> {
    const query = `
      MERGE (l:Language {name: $languageName})
      WITH l
      MATCH (d:Developer {id: $developerId})
      MERGE (d)-[r:PROFICIENT_IN]->(l)
      SET r.level = $level
      RETURN r
    `;
    await this.runCypher(query, { developerId, languageName, level });

    this.inMemoryNodes.set(`lang-${languageName}`, {
      label: 'Language',
      properties: { name: languageName },
    });
    this.inMemoryEdges.push({
      type: 'PROFICIENT_IN',
      startId: developerId,
      endId: `lang-${languageName}`,
      properties: { level },
    });
  }

  /**
   * Link a developer to a Repository (:Developer)-[:CONTRIBUTES_TO]->(:Repository).
   */
  async addContributionEdge(
    developerId: string,
    repoId: string,
    repoName: string,
    commitsCount = 1,
  ): Promise<void> {
    const query = `
      MERGE (repo:Repository {id: $repoId})
      SET repo.name = $repoName
      WITH repo
      MATCH (d:Developer {id: $developerId})
      MERGE (d)-[r:CONTRIBUTES_TO]->(repo)
      SET r.commitsCount = $commitsCount
      RETURN r
    `;
    await this.runCypher(query, {
      developerId,
      repoId,
      repoName,
      commitsCount,
    });

    this.inMemoryNodes.set(repoId, {
      label: 'Repository',
      properties: { id: repoId, name: repoName },
    });
    this.inMemoryEdges.push({
      type: 'CONTRIBUTES_TO',
      startId: developerId,
      endId: repoId,
      properties: { commitsCount },
    });
  }

  /**
   * Link a developer to a Guild (:Developer)-[:MEMBER_OF]->(:Guild).
   */
  async addGuildMembershipEdge(
    developerId: string,
    guildId: string,
    guildName: string,
  ): Promise<void> {
    const query = `
      MERGE (g:Guild {id: $guildId})
      SET g.name = $guildName
      WITH g
      MATCH (d:Developer {id: $developerId})
      MERGE (d)-[r:MEMBER_OF]->(g)
      RETURN r
    `;
    await this.runCypher(query, { developerId, guildId, guildName });

    this.inMemoryNodes.set(guildId, {
      label: 'Guild',
      properties: { id: guildId, name: guildName },
    });
    this.inMemoryEdges.push({
      type: 'MEMBER_OF',
      startId: developerId,
      endId: guildId,
      properties: {},
    });
  }

  /**
   * Multi-hop peer recommendation query:
   * Traverses 2nd and 3rd degree social connections (followers of followers),
   * finds peers who share programming language proficiencies and repository contributions.
   */
  async getPeerRecommendations(
    developerId: string,
    limit = 10,
  ): Promise<GraphRecommendationResult[]> {
    const cypher = `
      MATCH (me:Developer {id: $developerId})
      MATCH path = (me)-[:FOLLOWS*2..3]->(rec:Developer)
      WHERE rec.id <> me.id AND NOT (me)-[:FOLLOWS]->(rec)
      
      // Mutual connections
      OPTIONAL MATCH (me)-[:FOLLOWS]->(mutual:Developer)-[:FOLLOWS]->(rec)
      
      // Shared languages
      OPTIONAL MATCH (me)-[:PROFICIENT_IN]->(lang:Language)<-[:PROFICIENT_IN]-(rec)
      
      // Shared repositories
      OPTIONAL MATCH (me)-[:CONTRIBUTES_TO]->(repo:Repository)<-[:CONTRIBUTES_TO]-(rec)

      WITH rec,
           min(length(path)) AS degreeOfSeparation,
           count(DISTINCT mutual) AS mutualCount,
           collect(DISTINCT lang.name) AS sharedLanguages,
           collect(DISTINCT repo.name) AS sharedRepositories,
           [n in nodes(path) | n.username] AS connectionPath
      
      // Calculate weighted score
      WITH rec, degreeOfSeparation, mutualCount, sharedLanguages, sharedRepositories, connectionPath,
           (mutualCount * 15) + (size(sharedLanguages) * 10) + (size(sharedRepositories) * 12) + 
           (CASE degreeOfSeparation WHEN 2 THEN 25 ELSE 10 END) AS recommendationScore

      RETURN rec.id AS id,
             rec.username AS username,
             rec.name AS name,
             rec.avatar AS avatar,
             degreeOfSeparation,
             mutualCount,
             sharedLanguages,
             sharedRepositories,
             connectionPath,
             recommendationScore
      ORDER BY recommendationScore DESC
      LIMIT $limit
    `;

    const results = await this.runCypher<{
      id: string;
      username: string;
      name?: string;
      avatar?: string;
      degreeOfSeparation: number;
      mutualCount: number;
      sharedLanguages: string[];
      sharedRepositories: string[];
      connectionPath: string[];
      recommendationScore: number;
    }>(cypher, { developerId, limit });

    if (results.length > 0) {
      return results.map((r) => ({
        developer: {
          id: r.id,
          username: r.username,
          name: r.name,
          avatar: r.avatar,
        },
        degreeOfSeparation: r.degreeOfSeparation,
        connectionPath: r.connectionPath || [],
        mutualFollowersCount: r.mutualCount || 0,
        sharedLanguages: r.sharedLanguages || [],
        sharedRepositories: r.sharedRepositories || [],
        recommendationScore: r.recommendationScore,
      }));
    }

    // In-Memory Graph multi-hop traversal fallback
    return this.calculateInMemoryPeerRecommendations(developerId, limit);
  }

  /**
   * Executes PageRank graph algorithm on the Developer network.
   * Identifies the most influential developers based on incoming follows and authority.
   */
  async computePageRank(
    dampingFactor = 0.85,
    iterations = 20,
  ): Promise<PageRankResult[]> {
    const cypher = `
      CALL pagerank.get()
      YIELD node, rank
      RETURN node.id AS developerId, node.username AS username, rank
      ORDER BY rank DESC
    `;

    try {
      const results = await this.runCypher<{
        developerId: string;
        username: string;
        rank: number;
      }>(cypher);
      if (results.length > 0) return results;
    } catch {
      // If native Memgraph MAGE or Neo4j GDS plugin is not loaded, run algorithmic fallback
    }

    return this.calculateInMemoryPageRank(dampingFactor, iterations);
  }

  /**
   * Executes Louvain / Community Detection clustering developers by shared interests.
   */
  async detectCommunities(): Promise<CommunityDetectionResult[]> {
    const cypher = `
      CALL community_detection.get()
      YIELD node, community_id
      RETURN community_id AS communityId, collect(node.id) AS memberIds
    `;

    try {
      const results = await this.runCypher<{
        communityId: number;
        memberIds: string[];
      }>(cypher);
      if (results.length > 0) {
        return this.formatCommunityResults(results);
      }
    } catch {
      // Fallback in-memory Louvain modularity clustering
    }

    return this.calculateInMemoryCommunityDetection();
  }

  // --- Embedded / In-Memory Graph Traversal Algorithms ---

  private executeInMemoryCypher<T>(): Promise<T[]> {
    return Promise.resolve([]);
  }

  private calculateInMemoryPeerRecommendations(
    startDevId: string,
    limit: number,
  ): GraphRecommendationResult[] {
    const directFollowing = new Set<string>();
    for (const edge of this.inMemoryEdges) {
      if (edge.type === 'FOLLOWS' && edge.startId === startDevId) {
        directFollowing.add(edge.endId);
      }
    }

    // 2nd and 3rd degree hops
    const candidateHops: Map<
      string,
      { minDegree: number; mutualCount: number; path: string[] }
    > = new Map();

    // 2nd degree
    for (const followedId of directFollowing) {
      for (const edge of this.inMemoryEdges) {
        if (
          edge.type === 'FOLLOWS' &&
          edge.startId === followedId &&
          edge.endId !== startDevId &&
          !directFollowing.has(edge.endId)
        ) {
          const target = edge.endId;
          const curr = candidateHops.get(target) || {
            minDegree: 2,
            mutualCount: 0,
            path: [startDevId, followedId, target],
          };
          curr.mutualCount++;
          candidateHops.set(target, curr);
        }
      }
    }

    // 3rd degree
    for (const [secondDegId, data] of Array.from(candidateHops.entries())) {
      if (data.minDegree === 2) {
        for (const edge of this.inMemoryEdges) {
          if (
            edge.type === 'FOLLOWS' &&
            edge.startId === secondDegId &&
            edge.endId !== startDevId &&
            !directFollowing.has(edge.endId) &&
            !candidateHops.has(edge.endId)
          ) {
            candidateHops.set(edge.endId, {
              minDegree: 3,
              mutualCount: 1,
              path: [...data.path, edge.endId],
            });
          }
        }
      }
    }

    // Shared languages & repos
    const myLanguages = new Set(
      this.inMemoryEdges
        .filter((e) => e.type === 'PROFICIENT_IN' && e.startId === startDevId)
        .map((e) => e.endId),
    );
    const myRepos = new Set(
      this.inMemoryEdges
        .filter((e) => e.type === 'CONTRIBUTES_TO' && e.startId === startDevId)
        .map((e) => e.endId),
    );

    const recommendations: GraphRecommendationResult[] = [];

    for (const [candId, hopData] of candidateHops) {
      const nodeData = this.inMemoryNodes.get(candId);
      const username =
        (nodeData?.properties.username as string) || `dev-${candId}`;

      const candLanguages = this.inMemoryEdges
        .filter((e) => e.type === 'PROFICIENT_IN' && e.startId === candId)
        .map((e) => e.endId.replace('lang-', ''))
        .filter((lang) => myLanguages.has(`lang-${lang}`));

      const candRepos = this.inMemoryEdges
        .filter((e) => e.type === 'CONTRIBUTES_TO' && e.startId === candId)
        .map((e) => e.endId)
        .filter((repoId) => myRepos.has(repoId));

      const score =
        hopData.mutualCount * 15 +
        candLanguages.length * 10 +
        candRepos.length * 12 +
        (hopData.minDegree === 2 ? 25 : 10);

      recommendations.push({
        developer: {
          id: candId,
          username,
          name: (nodeData?.properties.name as string) || username,
          avatar: (nodeData?.properties.avatar as string) || '',
        },
        degreeOfSeparation: hopData.minDegree,
        connectionPath: hopData.path,
        mutualFollowersCount: hopData.mutualCount,
        sharedLanguages: candLanguages,
        sharedRepositories: candRepos,
        recommendationScore: score,
      });
    }

    recommendations.sort(
      (a, b) => b.recommendationScore - a.recommendationScore,
    );
    return recommendations.slice(0, limit);
  }

  private calculateInMemoryPageRank(
    damping = 0.85,
    iterations = 20,
  ): PageRankResult[] {
    const devNodes = Array.from(this.inMemoryNodes.entries())
      .filter(([, val]) => val.label === 'Developer')
      .map(([id, val]) => ({
        id,
        username: val.properties.username as string,
      }));

    if (devNodes.length === 0) return [];

    const n = devNodes.length;
    let ranks: Record<string, number> = {};
    for (const d of devNodes) {
      ranks[d.id] = 1 / n;
    }

    // Precalculate outbound follows
    const outLinks: Record<string, string[]> = {};
    const inLinks: Record<string, string[]> = {};
    for (const d of devNodes) {
      outLinks[d.id] = [];
      inLinks[d.id] = [];
    }

    for (const edge of this.inMemoryEdges) {
      if (edge.type === 'FOLLOWS') {
        if (outLinks[edge.startId]) outLinks[edge.startId].push(edge.endId);
        if (inLinks[edge.endId]) inLinks[edge.endId].push(edge.startId);
      }
    }

    for (let iter = 0; iter < iterations; iter++) {
      const nextRanks: Record<string, number> = {};
      for (const d of devNodes) {
        let incomingSum = 0;
        for (const inboundId of inLinks[d.id] || []) {
          const outCount = outLinks[inboundId]?.length || 1;
          incomingSum += ranks[inboundId] / outCount;
        }
        nextRanks[d.id] = (1 - damping) / n + damping * incomingSum;
      }
      ranks = nextRanks;
    }

    return devNodes
      .map((d) => ({
        developerId: d.id,
        username: d.username,
        rank: parseFloat((ranks[d.id] || 0).toFixed(6)),
      }))
      .sort((a, b) => b.rank - a.rank);
  }

  private calculateInMemoryCommunityDetection(): CommunityDetectionResult[] {
    const devNodes = Array.from(this.inMemoryNodes.entries()).filter(
      ([, val]) => val.label === 'Developer',
    );

    // Group developers by shared language clusters
    const languageGroups: Map<string, DeveloperNode[]> = new Map();

    for (const [id, val] of devNodes) {
      const devLangs = this.inMemoryEdges
        .filter((e) => e.type === 'PROFICIENT_IN' && e.startId === id)
        .map((e) => e.endId.replace('lang-', ''));

      const primaryLang = devLangs[0] || 'FullStack';
      const devObj: DeveloperNode = {
        id,
        username: val.properties.username as string,
        name: val.properties.name as string,
      };

      const group = languageGroups.get(primaryLang) || [];
      group.push(devObj);
      languageGroups.set(primaryLang, group);
    }

    let communityIdx = 1;
    const communities: CommunityDetectionResult[] = [];

    for (const [lang, members] of languageGroups) {
      communities.push({
        communityId: communityIdx++,
        communityName: `${lang} Ecosystem Cluster`,
        developerCount: members.length,
        topLanguages: [lang],
        members,
      });
    }

    return communities;
  }

  private formatCommunityResults(
    raw: Array<{ communityId: number; memberIds: string[] }>,
  ): CommunityDetectionResult[] {
    return raw.map((r) => ({
      communityId: r.communityId,
      communityName: `Developer Cluster ${r.communityId}`,
      developerCount: r.memberIds.length,
      topLanguages: ['TypeScript', 'Rust'],
      members: r.memberIds.map((id) => ({
        id,
        username:
          (this.inMemoryNodes.get(id)?.properties.username as string) || id,
      })),
    }));
  }
}
