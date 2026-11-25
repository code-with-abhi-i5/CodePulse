/**
 * Architecture Service: GraphQL Union Type Resolver
 * Subsystem: GraphQL Schema & Polymorphic Type Resolution
 */

export interface RewardBase {
  id: string;
  kind: 'XP' | 'BADGE' | 'CERTIFICATE';
}

export class GraphqlUnionTypeResolverService {
  public resolveType(value: RewardBase): string {
    switch (value.kind) {
      case 'XP': return 'ExperiencePointsReward';
      case 'BADGE': return 'BadgeReward';
      case 'CERTIFICATE': return 'CertificateReward';
      default: return 'UnknownReward';
    }
  }
}
