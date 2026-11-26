import { IncidentMetadata, TimelineEntry, PostMortemDocument } from '../../types/sre';

export class IncidentPostmortemGenerator {
  generate(
    meta: IncidentMetadata,
    timeline: TimelineEntry[],
    fiveWhys: string[],
    actionItems: string[]
  ): PostMortemDocument {
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
