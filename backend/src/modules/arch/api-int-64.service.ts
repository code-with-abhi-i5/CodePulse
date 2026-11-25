/**
 * Architecture Service: GraphQL Schema Stitching Federation Gateway
 * Subsystem: API Communication Protocols & Ingress Management [API-INT-64]
 */

export interface SubgraphResolver {
  name: string;
  query: (field: string, args: Record<string, unknown>) => Promise<unknown>;
}

export class GraphqlSchemaStitchingGatewayService {
  private subgraphs: Map<string, SubgraphResolver>;

  constructor() {
    this.subgraphs = new Map();
  }

  public registerSubgraph(name: string, resolver: SubgraphResolver): void {
    this.subgraphs.set(name, resolver);
  }

  public async executeStitchedQuery(
    operations: Array<{ subgraph: string; field: string; args: Record<string, unknown> }>
  ): Promise<{ data: Record<string, unknown>; errors: Array<{ subgraph: string; error: string }> }> {
    const data: Record<string, unknown> = {};
    const errors: Array<{ subgraph: string; error: string }> = [];

    await Promise.all(
      operations.map(async (op) => {
        const resolver = this.subgraphs.get(op.subgraph);
        if (!resolver) {
          errors.push({ subgraph: op.subgraph, error: `Subgraph ${op.subgraph} not found` });
          return;
        }

        try {
          const res = await resolver.query(op.field, op.args);
          data[`${op.subgraph}_${op.field}`] = res;
        } catch (err: any) {
          errors.push({ subgraph: op.subgraph, error: err.message });
        }
      })
    );

    return { data, errors };
  }

  public async resolveFederatedBattleWithChallenges(battleId: string): Promise<Record<string, unknown>> {
    const battleSubgraph = this.subgraphs.get('battles');
    const challengeSubgraph = this.subgraphs.get('challenges');

    if (!battleSubgraph || !challengeSubgraph) {
      throw new Error('Both battles and challenges subgraphs must be registered');
    }

    const battle: any = await battleSubgraph.query('getBattle', { id: battleId });
    const challengeIds: string[] = battle.challengeIds || [];

    const challenges = await Promise.all(
      challengeIds.map((cId) => challengeSubgraph.query('getChallenge', { id: cId }))
    );

    return {
      ...battle,
      challenges
    };
  }
}
