import test from 'node:test';
import assert from 'node:assert/strict';

class DeadLetterQueueAnalyzer {
  classifyFailure(jobId, queueName, errorMessage, stackTrace) {
    const combined = `${errorMessage} ${stackTrace}`.toLowerCase();

    if (combined.includes('etimedout') || combined.includes('timeout') || combined.includes('deadline_exceeded')) {
      return {
        jobId,
        queueName,
        category: 'timeout',
        rootCause: 'Downstream dependency response timeout',
        retryRecommended: true
      };
    }

    if (combined.includes('heap out of memory') || combined.includes('oom') || combined.includes('enomem')) {
      return {
        jobId,
        queueName,
        category: 'memory_limit',
        rootCause: 'Node.js V8 execution memory limit breached',
        retryRecommended: false
      };
    }

    if (combined.includes('rate limit') || combined.includes('429') || combined.includes('too many requests')) {
      return {
        jobId,
        queueName,
        category: 'rate_limit',
        rootCause: 'API rate limit governor threshold triggered',
        retryRecommended: true
      };
    }

    if (combined.includes('syntaxerror') || combined.includes('typeerror') || combined.includes('referenceerror')) {
      return {
        jobId,
        queueName,
        category: 'syntax_error',
        rootCause: 'Code execution error in user submission handler',
        retryRecommended: false
      };
    }

    return {
      jobId,
      queueName,
      category: 'unknown',
      rootCause: errorMessage || 'Unclassified job execution failure',
      retryRecommended: false
    };
  }
}

test('DeadLetterQueueAnalyzer - classifies DLQ failures into root causes and retry decisions', () => {
  const analyzer = new DeadLetterQueueAnalyzer();

  const t1 = analyzer.classifyFailure('job_1', 'execution', 'ETIMEDOUT connecting to compiler', '');
  assert.strictEqual(t1.category, 'timeout');
  assert.strictEqual(t1.retryRecommended, true);

  const t2 = analyzer.classifyFailure('job_2', 'compilation', 'JavaScript heap out of memory', '');
  assert.strictEqual(t2.category, 'memory_limit');
  assert.strictEqual(t2.retryRecommended, false);
});
