/**
 * Architecture Service: GraphQL Field-Level RBAC Directive
 * Subsystem: API Authorization & Data Masking
 */

export class GraphqlRbacDirectiveService {
  private readonly fieldRequirements = new Map<string, string[]>(); // fieldPath -> requiredRoles

  public registerFieldRule(type: string, field: string, requiredRoles: string[]): void {
    this.fieldRequirements.set(`${type}.${field}`, requiredRoles);
  }

  public authorizeFieldAccess(type: string, field: string, userRoles: string[]): boolean {
    const key = `${type}.${field}`;
    const required = this.fieldRequirements.get(key);
    if (!required || required.length === 0) {
      return true; // Public field
    }

    return required.some(role => userRoles.includes(role));
  }
}
