import { ReplicaLoadProfile } from '../../types/db';

export class ReplicaLoadBalancerService {
  constructor(private readonly maxLagToleranceSeconds: number = 10) {}

  public selectReplica(replicas: ReplicaLoadProfile[]): ReplicaLoadProfile | null {
    const eligible = replicas.filter(r => r.isEligible && r.lagSeconds <= this.maxLagToleranceSeconds);

    if (eligible.length === 0) {
      return null;
    }

    // Select replica with lowest lag and least active queries
    return eligible.sort((a, b) => a.lagSeconds - b.lagSeconds || a.activeQueries - b.activeQueries)[0];
  }
}
