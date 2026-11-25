import assert from 'node:assert/strict';
import { BuildkitCacheMountOptimizerService } from './devops-infra-01.service.ts';

const optimizer = new BuildkitCacheMountOptimizerService();

const sampleDocker = `
FROM node:20-alpine AS deps
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
`;

const analysis = optimizer.analyzeDockerfile(sampleDocker);
assert.strictEqual(analysis.stages.length, 2);
assert.strictEqual(analysis.stages[0].stageName, 'deps');
assert.strictEqual(analysis.stages[0].hasCacheMount, true);
assert.strictEqual(analysis.stages[0].hasPnpmStoreMount, true);
assert.strictEqual(analysis.isOptimized, true);

console.log('Issue #3081 [DEVOPS-INFRA-01] spec passed successfully.');
