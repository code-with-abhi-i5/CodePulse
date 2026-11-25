/**
 * Architecture Service: gRPC Server Reflection & Documentation Generator
 * Subsystem: API Contracts & Schema Reflection
 */

export interface GrpcServiceDescriptor {
  name: string;
  methods: { name: string; requestType: string; responseType: string; isStreaming: boolean }[];
}

export class GrpcReflectionDocumentationService {
  private readonly registeredServices = new Map<string, GrpcServiceDescriptor>();

  public registerService(descriptor: GrpcServiceDescriptor): void {
    this.registeredServices.set(descriptor.name, descriptor);
  }

  public listServices(): string[] {
    return Array.from(this.registeredServices.keys());
  }

  public getServiceDescriptor(name: string): GrpcServiceDescriptor | undefined {
    return this.registeredServices.get(name);
  }

  public generateMarkdownDocs(): string {
    let md = '# gRPC Service Documentation\n\n';
    for (const [name, desc] of this.registeredServices.entries()) {
      md += `## Service: ${name}\n\n`;
      md += '| Method | Request | Response | Streaming |\n|---|---|---|---|\n';
      for (const m of desc.methods) {
        md += `| ${m.name} | ${m.requestType} | ${m.responseType} | ${m.isStreaming} |\n`;
      }
      md += '\n';
    }
    return md;
  }
}
