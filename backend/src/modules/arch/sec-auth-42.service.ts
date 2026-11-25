/**
 * Architecture Service: SCIM 2.0 Enterprise Identity Provisioning Gateway
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-42]
 */

export interface ScimUserResource {
  schemas: string[];
  id?: string;
  userName: string;
  name?: { formatted?: string; familyName?: string; givenName?: string };
  emails: Array<{ value: string; primary?: boolean; type?: string }>;
  active: boolean;
}

export class ScimIdentityProvisioningGatewayService {
  private bearerToken: string;
  private users: Map<string, ScimUserResource>;

  constructor(bearerToken: string = 'scim-bearer-token-enterprise-secret') {
    this.bearerToken = bearerToken;
    this.users = new Map<string, ScimUserResource>();
  }

  public authorizeRequest(authHeader: string | undefined): boolean {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.slice(7).trim();
    return token === this.bearerToken;
  }

  public validateUserSchema(payload: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!payload || typeof payload !== 'object') {
      return { valid: false, errors: ['Payload must be a JSON object'] };
    }
    if (!Array.isArray(payload.schemas) || !payload.schemas.includes('urn:ietf:params:scim:schemas:core:2.0:User')) {
      errors.push('Missing required SCIM 2.0 User schema URI');
    }
    if (!payload.userName || typeof payload.userName !== 'string' || payload.userName.trim().length === 0) {
      errors.push('userName is required');
    }
    if (!Array.isArray(payload.emails) || payload.emails.length === 0) {
      errors.push('At least one email is required in emails array');
    }
    return { valid: errors.length === 0, errors };
  }

  public provisionUser(payload: ScimUserResource): { statusCode: number; body: any } {
    const validation = this.validateUserSchema(payload);
    if (!validation.valid) {
      return {
        statusCode: 400,
        body: {
          schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
          status: '400',
          detail: validation.errors.join('; ')
        }
      };
    }

    const id = payload.id || `scim-user-${Date.now()}`;
    const user: ScimUserResource = {
      ...payload,
      id,
      active: payload.active ?? true
    };
    this.users.set(id, user);

    return {
      statusCode: 201,
      body: user
    };
  }

  public deprovisionUser(userId: string): { statusCode: number; body?: any } {
    if (!this.users.has(userId)) {
      return {
        statusCode: 404,
        body: { schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '404', detail: 'User not found' }
      };
    }
    const user = this.users.get(userId)!;
    user.active = false;
    return { statusCode: 204 };
  }

  public getUser(userId: string): ScimUserResource | undefined {
    return this.users.get(userId);
  }
}
