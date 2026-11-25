import assert from 'node:assert/strict';
import { EphemeralPreviewDeployerService } from './devops-infra-05.service.ts';

const deployer = new EphemeralPreviewDeployerService('preview.codepulse.io', 3600000);

const env1 = deployer.provision(42);
assert.strictEqual(env1.namespace, 'pr-42');
assert.strictEqual(env1.subdomain, 'pr-42.preview.codepulse.io');
assert.strictEqual(env1.status, 'ready');

assert.strictEqual(deployer.getEnv(42) !== null, true);

const torn = deployer.teardown(42);
assert.strictEqual(torn, true);
assert.strictEqual(deployer.getEnv(42), null);

console.log('Issue #3085 [DEVOPS-INFRA-05] spec passed successfully.');
