/**
 * Architecture Service: Docker Compose Dev Stack Manager & Validator
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-11]
 */

export interface ComposeServiceDefinition {
  name: string;
  image?: string;
  ports?: string[];
  volumes?: string[];
  healthcheck?: boolean;
}

export class DockerComposeDevStackService {
  private services: Map<string, ComposeServiceDefinition>;

  constructor() {
    this.services = new Map();
  }

  public registerService(svc: ComposeServiceDefinition): void {
    this.services.set(svc.name, svc);
  }

  public validateDevelopmentStack(): { isValid: boolean; missingServices: string[]; missingHotReload: string[] } {
    const requiredServices = ['postgres', 'redis', 'backend', 'frontend'];
    const missingServices: string[] = [];
    const missingHotReload: string[] = [];

    for (const req of requiredServices) {
      if (!this.services.has(req)) {
        missingServices.push(req);
      }
    }

    for (const app of ['backend', 'frontend']) {
      const svc = this.services.get(app);
      if (svc && (!svc.volumes || !svc.volumes.some(v => v.includes(':')))) {
        missingHotReload.push(app);
      }
    }

    return {
      isValid: missingServices.length === 0 && missingHotReload.length === 0,
      missingServices,
      missingHotReload
    };
  }
}
