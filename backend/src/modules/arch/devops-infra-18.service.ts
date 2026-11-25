/**
 * Architecture Service: Kubernetes Zero-Trust Network Policy Generator
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-18]
 */

export interface NetworkPolicyRule {
  targetApp: string;
  allowedIngressApps: string[];
  allowedPort: number;
}

export class K8sZeroTrustNetworkPolicyService {
  public generateDefaultDenyAll(namespace: string): string {
    return [
      'apiVersion: networking.k8s.io/v1',
      'kind: NetworkPolicy',
      'metadata:',
      '  name: default-deny-all',
      '  namespace: ' + namespace,
      'spec:',
      '  podSelector: {}',
      '  policyTypes:',
      '  - Ingress',
      '  - Egress'
    ].join('\n');
  }

  public generateIngressPolicy(namespace: string, rule: NetworkPolicyRule): string {
    const ingressFrom = rule.allowedIngressApps.map(app => 
      '    - podSelector:\n        matchLabels:\n          app: ' + app
    ).join('\n');

    return [
      'apiVersion: networking.k8s.io/v1',
      'kind: NetworkPolicy',
      'metadata:',
      '  name: allow-' + rule.targetApp,
      '  namespace: ' + namespace,
      'spec:',
      '  podSelector:',
      '    matchLabels:',
      '      app: ' + rule.targetApp,
      '  ingress:',
      '  - from:',
      ingressFrom,
      '    ports:',
      '    - protocol: TCP',
      '      port: ' + rule.allowedPort,
      '  policyTypes:',
      '  - Ingress'
    ].join('\n');
  }
}
