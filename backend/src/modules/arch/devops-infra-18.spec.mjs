import assert from 'node:assert/strict';
import { K8sZeroTrustNetworkPolicyService } from './devops-infra-18.service.ts';

const generator = new K8sZeroTrustNetworkPolicyService();

const denyAll = generator.generateDefaultDenyAll('production');
assert.ok(denyAll.includes('kind: NetworkPolicy'));
assert.ok(denyAll.includes('name: default-deny-all'));

const allowBackend = generator.generateIngressPolicy('production', {
  targetApp: 'backend',
  allowedIngressApps: ['ingress-nginx', 'frontend'],
  allowedPort: 4000
});

assert.ok(allowBackend.includes('name: allow-backend'));
assert.ok(allowBackend.includes('port: 4000'));
assert.ok(allowBackend.includes('app: frontend'));

console.log('Issue #3098 [DEVOPS-INFRA-18] spec passed successfully.');
