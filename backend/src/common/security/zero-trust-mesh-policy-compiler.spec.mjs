import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class ZeroTrustMeshPolicyCompilerService {
  compilePolicy(serviceName, spiffeId, rolePermissions) {
    const allowedMethods = Array.from(new Set(rolePermissions.flatMap(r => r.methods)));
    const pathPrefixes = Array.from(new Set(rolePermissions.flatMap(r => r.paths)));

    return {
      policyName: 'mesh-policy-' + serviceName,
      spiffeId,
      allowedMethods,
      pathPrefixes,
      action: 'ALLOW'
    };
  }

  toEnvoyRbacJson(policy) {
    return JSON.stringify({
      action: policy.action,
      rules: {
        principals: [{ authenticated: { principal: policy.spiffeId } }],
        permissions: policy.allowedMethods.map(m => ({
          and_rules: {
            rules: [
              { header: { name: ':method', exact_match: m } },
              { url_path: { path: { prefix: policy.pathPrefixes[0] || '/' } } }
            ]
          }
        }))
      }
    }, null, 2);
  }
}

describe('ZeroTrustMeshPolicyCompilerService', () => {
  const compiler = new ZeroTrustMeshPolicyCompilerService();

  it('compiles SPIFFE-authenticated zero-trust policies for microservices', () => {
    const policy = compiler.compilePolicy('billing-service', 'spiffe://cluster.local/ns/default/sa/billing', [
      { role: 'reader', methods: ['GET'], paths: ['/api/v1/invoices'] },
      { role: 'writer', methods: ['POST'], paths: ['/api/v1/payments'] }
    ]);

    assert.equal(policy.policyName, 'mesh-policy-billing-service');
    assert.deepEqual(policy.allowedMethods, ['GET', 'POST']);
    assert.equal(policy.action, 'ALLOW');

    const json = compiler.toEnvoyRbacJson(policy);
    assert.ok(json.includes('spiffe://cluster.local/ns/default/sa/billing'));
  });
});
