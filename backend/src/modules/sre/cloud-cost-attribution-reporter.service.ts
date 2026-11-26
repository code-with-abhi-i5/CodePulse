import { CloudCostAttribution } from '../../types/sre';

export class CloudCostAttributionReporter {
  calculateAttribution(
    category: string,
    language: string,
    ec2HourlyRate: number,
    ec2ExecutionHours: number,
    rdsHourlyRate: number,
    rdsIoHours: number,
    submissionCount: number
  ): CloudCostAttribution {
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
