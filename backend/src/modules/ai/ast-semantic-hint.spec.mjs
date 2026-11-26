import assert from 'node:assert/strict';
import test from 'node:test';

class AstSemanticHintService {
  generateHintTree(code, failureDetails) {
    const hints = [
      { level: 1, category: 'ALGORITHM', guidance: 'Consider boundary condition.' }
    ];
    if (!code.includes('return') || failureDetails.actual === 'undefined') {
      hints.push({ level: 2, category: 'SYNTAX', guidance: 'Ensure explicit return.' });
    }
    hints.push({ level: 3, category: 'EDGE_CASE', guidance: 'Check loop invariant.' });
    return hints;
  }
}

test('AstSemanticHintService: generates 3-tier progressive hints without leaking direct code', () => {
  const service = new AstSemanticHintService();
  const hints = service.generateHintTree('function solve() {}', { expected: '42', actual: 'undefined' });

  assert.equal(hints.length, 3);
  assert.equal(hints[0].level, 1);
  assert.equal(hints[1].level, 2);
  assert.equal(hints[2].level, 3);
  assert.ok(!hints.some(h => h.guidance.includes('return 42;')));
});
