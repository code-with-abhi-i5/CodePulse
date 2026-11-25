/**
 * Architecture Service: Kubernetes Pod Disruption Budget (PDB) Configurator
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-13]
 */

export interface PdbSpec {
  name: string;
  namespace: string;
  selectorMatchLabels: Record<string, string>;
  minAvailable?: number | string;
  maxUnavailable?: number | string;
}

export class PodDisruptionBudgetConfiguratorService {
  public generatePdb(
    name: string,
    namespace: string,
    appLabel: string,
    replicas: number,
    criticality: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'
  ): PdbSpec {
    let minAvailable: number | string = 1;

    if (criticality === 'HIGH') {
      minAvailable = Math.max(1, Math.floor(replicas * 0.75));
    } else if (criticality === 'MEDIUM') {
      minAvailable = Math.max(1, Math.floor(replicas * 0.50));
    } else {
      minAvailable = 1;
    }

    return {
      name: name + '-pdb',
      namespace,
      selectorMatchLabels: { app: appLabel },
      minAvailable
    };
  }

  public toYaml(spec: PdbSpec): string {
    return [
      'apiVersion: policy/v1',
      'kind: PodDisruptionBudget',
      'metadata:',
      '  name: ' + spec.name,
      '  namespace: ' + spec.namespace,
      'spec:',
      '  minAvailable: ' + spec.minAvailable,
      '  selector:',
      '    matchLabels:',
      '      app: ' + spec.selectorMatchLabels.app
    ].join('\n');
  }
}
