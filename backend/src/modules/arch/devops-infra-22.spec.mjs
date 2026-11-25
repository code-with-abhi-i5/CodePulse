import assert from 'node:assert/strict';
import { PrMergeQueueBotService } from './devops-infra-22.service.ts';

const bot = new PrMergeQueueBotService();

bot.enqueue(101, 'feat/login');
bot.enqueue(102, 'fix/db-leak');
assert.strictEqual(bot.getQueueLength(), 2);

const r1 = await bot.processNext(async (pr) => true);
assert.strictEqual(r1.prNumber, 101);
assert.strictEqual(r1.status, 'merged');

const r2 = await bot.processNext(async (pr) => false);
assert.strictEqual(r2.prNumber, 102);
assert.strictEqual(r2.status, 'rejected');

assert.strictEqual(bot.getQueueLength(), 0);

console.log('Issue #3102 [DEVOPS-INFRA-22] spec passed successfully.');
