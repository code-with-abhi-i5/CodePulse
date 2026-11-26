import { TcpRetransmitMetric, NetworkDropAnomaly } from '../../types/sre';

export class TcpRetransmitDropDetector {
  private readonly dropThresholdPercent: number = 2.0;

  evaluateMetric(metric: TcpRetransmitMetric): NetworkDropAnomaly {
    if (metric.totalPackets === 0) {
      return {
        nodeId: metric.nodeId,
        isAnomaly: false,
        retransmitRatioPercent: 0,
        severity: 'normal'
      };
    }

    const ratioPercent = Math.round((metric.retransmitCount / metric.totalPackets) * 10000) / 100;
    const isAnomaly = ratioPercent >= this.dropThresholdPercent;

    let severity: 'normal' | 'warning' | 'critical' = 'normal';
    if (ratioPercent >= 5.0) {
      severity = 'critical';
    } else if (ratioPercent >= this.dropThresholdPercent) {
      severity = 'warning';
    }

    return {
      nodeId: metric.nodeId,
      isAnomaly,
      retransmitRatioPercent: ratioPercent,
      severity
    };
  }
}
