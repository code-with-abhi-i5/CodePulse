import { SandboxedSolutionResult } from '../../types/ai';

export class AiEvaluationValidator {
  validateExecutionResult(solutionId: string, totalTests: number, failedTests: number, rawOutput: string): SandboxedSolutionResult {
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
