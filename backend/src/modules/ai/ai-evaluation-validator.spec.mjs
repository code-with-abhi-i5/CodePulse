import test from 'node:test';
import assert from 'node:assert/strict';

class AiEvaluationValidator {
  validateExecutionResult(solutionId, totalTests, failedTests, rawOutput) {
    const passedAllTests = totalTests > 0 && failedTests === 0 && !rawOutput.includes('Error');

    return {
      solutionId,
      passedAllTests,
      testsRun: totalTests,
      testsFailed: failedTests,
      executionOutput: rawOutput
    };
  }
}

test('AiEvaluationValidator - verifies sandbox execution outcomes for AI generated code', () => {
  const validator = new AiEvaluationValidator();

  const success = validator.validateExecutionResult('sol-1', 5, 0, 'All 5 tests passed.');
  assert.strictEqual(success.passedAllTests, true);

  const fail = validator.validateExecutionResult('sol-2', 5, 1, 'Test 3 failed: AssertionError');
  assert.strictEqual(fail.passedAllTests, false);
});
