import assert from 'node:assert/strict';
import { DockerImageSizeOptimizerService } from './devops-infra-21.service.ts';

const optimizer = new DockerImageSizeOptimizerService();

const files = [
  '/app/.git/objects/pack/pack-123.pack',
  '/app/node_modules/express/README.md',
  '/app/src/index.ts',
  '/app/dist/index.js'
];

const res = optimizer.inspectLayerFiles(files);
assert.strictEqual(res.unnecessaryPatternsFound.length, 3);
assert.ok(res.estimatedWastedBytes > 50000000);
assert.ok(res.optimizationTips.includes('Add .git to .dockerignore'));

console.log('Issue #3101 [DEVOPS-INFRA-21] spec passed successfully.');
