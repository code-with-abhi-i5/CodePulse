import test from 'node:test';
import assert from 'node:assert/strict';

class IncidentPostmortemGenerator {
  generate(meta, timeline, fiveWhys, actionItems) {
    const ttdMinutes = Math.max(1, Math.round((meta.detectionTime - meta.startTime) / 60000));
    const ttrMinutes = Math.max(1, Math.round((meta.resolvedTime - meta.startTime) / 60000));

    const sortedTimeline = [...timeline].sort((a, b) => a.timestamp - b.timestamp);

    let markdown = `# Incident Post-Mortem: ${meta.title} (${meta.incidentId})\n\n`;
    markdown += `**Severity:** ${meta.severity}  \n`;
    markdown += `**Lead Commander:** ${meta.leadCommander}  \n`;
    markdown += `**Affected Services:** ${meta.affectedServices.join(', ')}  \n`;
    markdown += `**Time To Detect (TTD):** ${ttdMinutes} minutes  \n`;
    markdown += `**Time To Resolve (TTR):** ${ttrMinutes} minutes  \n\n`;

    markdown += `## Executive Summary\n`;
    markdown += `On ${new Date(meta.startTime).toISOString()}, an incident occurred impacting ${meta.affectedServices.join(', ')}. The issue was detected in ${ttdMinutes} minutes and fully resolved in ${ttrMinutes} minutes.\n\n`;

    markdown += `## Incident Timeline\n\n`;
    markdown += `| Timestamp (UTC) | Source | Author | Severity | Event Message |\n`;
    markdown += `|---|---|---|---|---|\n`;
    for (const t of sortedTimeline) {
      markdown += `| ${new Date(t.timestamp).toISOString()} | ${t.source} | ${t.author || 'System'} | ${t.severity || 'info'} | ${t.message} |\n`;
    }
    markdown += `\n`;

    markdown += `## 5-Whys Root Cause Analysis\n\n`;
    fiveWhys.forEach((why, idx) => {
      markdown += `${idx + 1}. ${why}\n`;
    });
    markdown += `\n`;

    markdown += `## Action Items & Preventative Measures\n\n`;
    actionItems.forEach((action, idx) => {
      markdown += `- [ ] **AI-${idx + 1}:** ${action}\n`;
    });

    return {
      incidentId: meta.incidentId,
      markdown,
      ttdMinutes,
      ttrMinutes,
      actionItemsCount: actionItems.length
    };
  }
}

test('IncidentPostmortemGenerator - compiles structured incident post-mortem markdown', () => {
  const generator = new IncidentPostmortemGenerator();
  const startTime = Date.now() - 3600000;
  const doc = generator.generate(
    {
      incidentId: 'INC-2026-081',
      title: 'Redis Connection Exhaustion During Global Tournament',
      severity: 'SEV1',
      startTime,
      detectionTime: startTime + 300000,
      resolvedTime: startTime + 3600000,
      leadCommander: 'Principal SRE',
      affectedServices: ['api-gateway', 'battle-engine']
    },
    [
      { timestamp: startTime, source: 'datadog', message: 'Connection pool spike alerted', severity: 'critical' },
      { timestamp: startTime + 600000, source: 'slack', author: 'sre-oncall', message: 'Scaled pool limit to 2000' }
    ],
    ['Pool exhausted', 'Too many concurrent sockets', 'Socket leak in retry loop'],
    ['Implement connection pool recycler', 'Add jitter to retry backoff']
  );

  assert.strictEqual(doc.incidentId, 'INC-2026-081');
  assert.strictEqual(doc.ttdMinutes, 5);
  assert.strictEqual(doc.ttrMinutes, 60);
  assert.strictEqual(doc.actionItemsCount, 2);
  assert.match(doc.markdown, /Redis Connection Exhaustion/);
  assert.match(doc.markdown, /5-Whys/);
});
