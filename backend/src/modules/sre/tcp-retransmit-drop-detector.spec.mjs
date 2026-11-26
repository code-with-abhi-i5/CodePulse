import test from 'node:test';
import assert from 'node:assert/strict';

class TcpRetransmitDropDetector {
  constructor(thresholdPercent = 2.0) {
    this.dropThresholdPercent = thresholdPercent;
  }

  evaluateMetric(metric) {
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

    let severity = 'normal';
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

test('TcpRetransmitDropDetector - identifies network drops from TCP retransmissions', () => {
  const detector = new TcpRetransmitDropDetector(2.0);

  const healthy = detector.evaluateMetric({ nodeId: 'k8s-node-1', interfaceName: 'eth0', retransmitCount: 5, totalPackets: 1000, rttMs: 2, timestamp: Date.now() });
  assert.strictEqual(healthy.isAnomaly, false);
  assert.strictEqual(healthy.severity, 'normal');

  const anomaly = detector.evaluateMetric({ nodeId: 'k8s-node-2', interfaceName: 'eth0', retransmitCount: 30, totalPackets: 1000, rttMs: 25, timestamp: Date.now() });
  assert.strictEqual(anomaly.isAnomaly, true);
  assert.strictEqual(anomaly.severity, 'warning');

  const critical = detector.evaluateMetric({ nodeId: 'k8s-node-3', interfaceName: 'eth0', retransmitCount: 80, totalPackets: 1000, rttMs: 100, timestamp: Date.now() });
  assert.strictEqual(critical.isAnomaly, true);
  assert.strictEqual(critical.severity, 'critical');
});
