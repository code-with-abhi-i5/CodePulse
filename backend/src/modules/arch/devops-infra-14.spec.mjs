import assert from 'node:assert/strict';
import { HelmChartTemplateSuiteService } from './devops-infra-14.service.ts';

const helm = new HelmChartTemplateSuiteService();

const values = {
  serviceName: 'judge-worker',
  imageTag: 'v2.4.1',
  port: 8080,
  replicas: 4,
  resources: {
    cpuLimit: '1000m',
    memoryLimit: '2Gi'
  }
};

const dep = helm.renderDeployment(values);
assert.ok(dep.includes('kind: Deployment'));
assert.ok(dep.includes('image: codepulse/judge-worker:v2.4.1'));

const svc = helm.renderService(values);
assert.ok(svc.includes('kind: Service'));
assert.ok(svc.includes('targetPort: 8080'));

console.log('Issue #3094 [DEVOPS-INFRA-14] spec passed successfully.');
