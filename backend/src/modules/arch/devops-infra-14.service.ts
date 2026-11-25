/**
 * Architecture Service: Helm Chart Template Suite
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-14]
 */

export interface HelmValues {
  serviceName: string;
  imageTag: string;
  port: number;
  replicas: number;
  resources: {
    cpuLimit: string;
    memoryLimit: string;
  };
}

export class HelmChartTemplateSuiteService {
  public renderDeployment(values: HelmValues): string {
    return [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      '  name: ' + values.serviceName,
      'spec:',
      '  replicas: ' + values.replicas,
      '  template:',
      '    spec:',
      '      containers:',
      '      - name: ' + values.serviceName,
      '        image: codepulse/' + values.serviceName + ':' + values.imageTag,
      '        ports:',
      '        - containerPort: ' + values.port,
      '        resources:',
      '          limits:',
      '            cpu: ' + values.resources.cpuLimit,
      '            memory: ' + values.resources.memoryLimit
    ].join('\n');
  }

  public renderService(values: HelmValues): string {
    return [
      'apiVersion: v1',
      'kind: Service',
      'metadata:',
      '  name: ' + values.serviceName + '-svc',
      'spec:',
      '  ports:',
      '  - port: 80',
      '    targetPort: ' + values.port,
      '  selector:',
      '    app: ' + values.serviceName
    ].join('\n');
  }
}
