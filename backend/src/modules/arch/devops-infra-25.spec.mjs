import assert from 'node:assert/strict';
import { BlueGreenTrafficSwitcherService } from './devops-infra-25.service.ts';

const switcher = new BlueGreenTrafficSwitcherService();
assert.strictEqual(switcher.getSplit().activeTarget, 'blue');

switcher.shiftTraffic(25);
assert.strictEqual(switcher.getSplit().blueWeight, 75);
assert.strictEqual(switcher.getSplit().greenWeight, 25);
assert.strictEqual(switcher.getSplit().activeTarget, 'split');

switcher.shiftTraffic(100);
assert.strictEqual(switcher.getSplit().activeTarget, 'green');

switcher.rollbackToBlue();
assert.strictEqual(switcher.getSplit().activeTarget, 'blue');

console.log('Issue #3105 [DEVOPS-INFRA-25] spec passed successfully.');
