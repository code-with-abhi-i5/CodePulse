import { NodeAffinityRule, AffinityEvaluation } from '../../types/sre';

export class K8sNodeAffinityController {
  private rules: NodeAffinityRule[] = [
    {
      podType: 'compiler',
      disallowedNodeLabels: { role: 'database', 'workload-type': 'stateful' },
      requiredNodeLabels: { 'workload-type': 'compute-intensive' }
    }
  ];

  evaluatePlacement(podType: 'compiler' | 'database' | 'api', nodeLabels: Record<string, string>, nodeName: string): AffinityEvaluation {
    const rule = this.rules.find(r => r.podType === podType);
    if (!rule) {
      return { allowed: true, targetNode: nodeName };
    }

    for (const [key, val] of Object.entries(rule.disallowedNodeLabels)) {
      if (nodeLabels[key] === val) {
        return {
          allowed: false,
          reason: `Anti-affinity violation: ${podType} cannot be scheduled on node with ${key}=${val}`,
          targetNode: nodeName
        };
      }
    }

    if (rule.requiredNodeLabels) {
      for (const [key, val] of Object.entries(rule.requiredNodeLabels)) {
        if (nodeLabels[key] !== val) {
          return {
            allowed: false,
            reason: `Required label missing: node must have ${key}=${val}`,
            targetNode: nodeName
          };
        }
      }
    }

    return { allowed: true, targetNode: nodeName };
  }
}
