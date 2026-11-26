import test from 'node:test';
import assert from 'node:assert/strict';

class CloudCostAttributionReporter {
  calculateAttribution(
    category,
    language,
    ec2HourlyRate,
    ec2ExecutionHours,
    rdsHourlyRate,
    rdsIoHours,
    submissionCount
  ) {
    const ec2CostUsd = Number((ec2HourlyRate * ec2ExecutionHours).toFixed(4));
    const rdsCostUsd = Number((rdsHourlyRate * rdsIoHours).toFixed(4));
    const totalCostUsd = Number((ec2CostUsd + rdsCostUsd).toFixed(4));
    const costPerSubmissionUsd = submissionCount > 0 ? Number((totalCostUsd / submissionCount).toFixed(6)) : 0;

    return {
      category,
      language,
      ec2CostUsd,
      rdsCostUsd,
      totalCostUsd,
      submissionCount,
      costPerSubmissionUsd
    };
  }
}

test('CloudCostAttributionReporter - calculates EC2, RDS, and per-submission cost attribution', () => {
  const reporter = new CloudCostAttributionReporter();
  const res = reporter.calculateAttribution('algorithms', 'typescript', 0.096, 50, 0.052, 20, 1000);
  assert.strictEqual(res.ec2CostUsd, 4.8);
  assert.strictEqual(res.rdsCostUsd, 1.04);
  assert.strictEqual(res.totalCostUsd, 5.84);
  assert.strictEqual(res.costPerSubmissionUsd, 0.00584);
});
