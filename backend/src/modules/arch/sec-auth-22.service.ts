/**
 * Architecture Service: GraphQL Introspection Query Sanitizer
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-22]
 */

export class GraphqlIntrospectionSanitizerService {
  private isProduction: boolean;

  constructor(isProduction: boolean = true) {
    this.isProduction = isProduction;
  }

  public validateQuery(query: string): { isAllowed: boolean; error?: string } {
    if (!this.isProduction) {
      return { isAllowed: true };
    }

    if (/\b(__schema|__type)\b/.test(query)) {
      return {
        isAllowed: false,
        error: 'GraphQL Introspection is disabled in production environments to prevent schema reconnaissance.'
      };
    }

    return { isAllowed: true };
  }
}
