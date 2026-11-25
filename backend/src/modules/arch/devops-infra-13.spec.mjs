import assert from 'node:assert/strict';
import { PodDisruptionBudgetConfiguratorService } from './devops-infra-13.service.ts';

const configurator = new PodDisruptionBudgetConfiguratorService();

const pdb = configurator.generatePdb('codepulse-api', 'production', 'backend', 6, 'HIGH');
assert.strictEqual(pdb.minAvailable, 4);
assert.strictEqual(pdb.name, 'codepulse-api-pdb');

const yaml = configurator.toYaml(pdb);
assert.ok(yaml.includes('kind: PodDisruptionBudget'));
assert.ok(yaml.includes('minAvailable: 4'));

console.log('Issue #3093 [DEVOPS-INFRA-13] spec passed successfully.');
