import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class K8sPodSecurityVerifierService {
  auditPodSecurityContext(manifest) {
    const violations = [];
    const podSecurityContext = manifest?.spec?.securityContext || {};
    const containers = manifest?.spec?.containers || [];

    if (podSecurityContext.runAsNonRoot !== true) {
      violations.push('Pod spec must declare runAsNonRoot: true');
    }

    for (const c of containers) {
      const cSec = c.securityContext || {};
      if (cSec.readOnlyRootFilesystem !== true) {
        violations.push('Container "' + c.name + '" must declare readOnlyRootFilesystem: true');
      }
      if (cSec.allowPrivilegeEscalation !== false) {
        violations.push('Container "' + c.name + '" must declare allowPrivilegeEscalation: false');
      }
      if (!cSec.capabilities?.drop?.includes('ALL')) {
        violations.push('Container "' + c.name + '" must drop ALL capabilities');
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

describe('K8sPodSecurityVerifierService', () => {
  const verifier = new K8sPodSecurityVerifierService();

  it('validates compliant production pod manifests with non-root and readonly rootfs', () => {
    const manifest = {
      spec: {
        securityContext: { runAsNonRoot: true },
        containers: [
          {
            name: 'api-server',
            securityContext: {
              readOnlyRootFilesystem: true,
              allowPrivilegeEscalation: false,
              capabilities: { drop: ['ALL'] }
            }
          }
        ]
      }
    };

    const res = verifier.auditPodSecurityContext(manifest);
    assert.equal(res.isCompliant, true);
    assert.equal(res.score, 100);
    assert.equal(res.violations.length, 0);
  });

  it('flags security context violations and reduces score accordingly', () => {
    const insecureManifest = {
      spec: {
        containers: [
          { name: 'insecure-container', securityContext: {} }
        ]
      }
    };

    const res = verifier.auditPodSecurityContext(insecureManifest);
    assert.equal(res.isCompliant, false);
    assert.ok(res.violations.some(v => v.includes('runAsNonRoot')));
    assert.ok(res.violations.some(v => v.includes('readOnlyRootFilesystem')));
  });
});
