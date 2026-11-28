import test from 'node:test';
import assert from 'node:assert/strict';

class CodeSyntaxErrorPredictorService {
  predictSyntaxErrors(snippet) {
    const stack = [];
    const pairs = { '(': ')', '{': '}', '[': ']' };
    const closers = { ')': '(', '}': '{', ']': '[' };

    for (let i = 0; i < snippet.length; i++) {
      const char = snippet[i];
      if (pairs[char]) stack.push(char);
      else if (closers[char]) {
        if (stack.length > 0 && stack[stack.length - 1] === closers[char]) stack.pop();
      }
    }

    const unclosed = stack.map(open => pairs[open]);
    return {
      hasSyntaxAnomaly: unclosed.length > 0,
      unclosedDelimiters: unclosed,
      suggestedCompletion: unclosed.reverse().join('')
    };
  }
}

test('CodeSyntaxErrorPredictorService - detects unclosed brackets and suggests completion', () => {
  const service = new CodeSyntaxErrorPredictorService();
  const res = service.predictSyntaxErrors('function test() { const arr = [1, 2;');
  assert.equal(res.hasSyntaxAnomaly, true);
  assert.ok(res.suggestedCompletion.includes('}'));
});
