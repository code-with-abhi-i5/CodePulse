import { PodSecurityAuditResult } from '../../types/security';

export class K8sPodSecurityVerifierService {
  public auditPodSecurityContext(manifest: any): PodSecurityAuditResult {
    const violations: string[] = [];
    const podSecurityContext = manifest?.spec?.securityContext || {};
    const containers = manifest?.spec?.containers || [];

    if (podSecurityContext.runAsNonRoot !== true) {
      violations.push('Pod spec must declare runAsNonRoot: true');
    }

    for (const c of containers) {
      const cSec = c.securityContext || {};
      if (cSec.readOnlyRootFilesystem !== true) {
        violations.push(`Container "${c.name}" must declare readOnlyRootFilesystem: true`);
      }
      if (cSec.allowPrivilegeEscalation !== false) {
        violations.push(`Container "${c.name}" must declare allowPrivilegeEscalation: false`);
      }
      if (!cSec.capabilities?.drop?.includes('ALL')) {
        violations.push(`Container "${c.name}" must drop ALL capabilities`);
      }
    }

    const isCompliant = violations.length === 0;
    const score = isCompliant ? 100 : Math.max(0, 100 - violations.length * 25);

    return {
      isCompliant,
      violations,
      score
    };
  }
}
