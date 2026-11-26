import test from 'node:test';
import assert from 'node:assert/strict';

class K8sNodeAffinityController {
  constructor() {
    this.rules = [
      {
        podType: 'compiler',
        disallowedNodeLabels: { role: 'database', 'workload-type': 'stateful' },
        requiredNodeLabels: { 'workload-type': 'compute-intensive' }
      }
    ];
  }

  evaluatePlacement(podType, nodeLabels, nodeName) {
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

test('K8sNodeAffinityController - enforces compiler and database pod segregation', () => {
  const ctrl = new K8sNodeAffinityController();

  const dbNode = { role: 'database', 'workload-type': 'stateful' };
  const res1 = ctrl.evaluatePlacement('compiler', dbNode, 'node-db-01');
  assert.strictEqual(res1.allowed, false);
  assert.match(res1.reason, /Anti-affinity violation/);

  const computeNode = { role: 'worker', 'workload-type': 'compute-intensive' };
  const res2 = ctrl.evaluatePlacement('compiler', computeNode, 'node-worker-05');
  assert.strictEqual(res2.allowed, true);
});
