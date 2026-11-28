import { EnvoyMeshPolicy } from '../../types/security';

export class ZeroTrustMeshPolicyCompilerService {
  public compilePolicy(
    serviceName: string,
    spiffeId: string,
    rolePermissions: Array<{ role: string; methods: string[]; paths: string[] }>
  ): EnvoyMeshPolicy {
    const allowedMethods = Array.from(new Set(rolePermissions.flatMap(r => r.methods)));
    const pathPrefixes = Array.from(new Set(rolePermissions.flatMap(r => r.paths)));

    return {
      policyName: `mesh-policy-${serviceName}`,
      spiffeId,
      allowedMethods,
      pathPrefixes,
      action: 'ALLOW'
    };
  }

  public toEnvoyRbacJson(policy: EnvoyMeshPolicy): string {
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
