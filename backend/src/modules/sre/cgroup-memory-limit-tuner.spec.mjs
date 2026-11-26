import test from 'node:test';
import assert from 'node:assert/strict';

class CgroupMemoryLimitTuner {
  evaluateStatus(currentBytes, maxBytes) {
    const utilizationPercent = Number(((currentBytes / maxBytes) * 100).toFixed(2));
    let oomRisk = 'low';

    if (utilizationPercent >= 90) {
      oomRisk = 'critical';
    } else if (utilizationPercent >= 75) {
      oomRisk = 'moderate';
    }

    return {
      currentBytes,
      maxBytes,
      utilizationPercent,
      oomRisk
    };
  }

  tuneLimits(status, expansionHeadroomBytes = 268435456) {
    if (status.oomRisk === 'critical') {
      return {
        adjustedLimitBytes: status.maxBytes + expansionHeadroomBytes,
        headroomAddedBytes: expansionHeadroomBytes,
        actionTaken: 'expanded'
      };
    }
    return {
      adjustedLimitBytes: status.maxBytes,
      headroomAddedBytes: 0,
      actionTaken: 'maintained'
    };
  }
}

test('CgroupMemoryLimitTuner - detects critical OOMKill risk and dynamically expands limit', () => {
  const tuner = new CgroupMemoryLimitTuner();
  const status = tuner.evaluateStatus(950 * 1024 * 1024, 1024 * 1024 * 1024);
  assert.strictEqual(status.oomRisk, 'critical');

  const decision = tuner.tuneLimits(status, 256 * 1024 * 1024);
  assert.strictEqual(decision.actionTaken, 'expanded');
  assert.strictEqual(decision.headroomAddedBytes, 256 * 1024 * 1024);
});
