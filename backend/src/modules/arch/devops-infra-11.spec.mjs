import assert from 'node:assert/strict';
import { DockerComposeDevStackService } from './devops-infra-11.service.ts';

const devStack = new DockerComposeDevStackService();

devStack.registerService({ name: 'postgres', image: 'postgres:16-alpine', healthcheck: true });
devStack.registerService({ name: 'redis', image: 'redis:7-alpine', healthcheck: true });
devStack.registerService({ name: 'backend', volumes: ['./backend:/app', '/app/node_modules'] });
devStack.registerService({ name: 'frontend', volumes: ['./frontend:/app', '/app/node_modules'] });

const validation = devStack.validateDevelopmentStack();
assert.strictEqual(validation.isValid, true);
assert.strictEqual(validation.missingServices.length, 0);

console.log('Issue #3091 [DEVOPS-INFRA-11] spec passed successfully.');
