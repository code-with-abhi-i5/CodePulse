import { SamlUserAssertion, ProvisionedUser } from '../../types/tenancy';

export class SamlSsoGateway {
  private existingUsers: Map<string, ProvisionedUser> = new Map();

  processAssertion(assertion: SamlUserAssertion, tenantId: string): ProvisionedUser {
    if (!assertion.email || !assertion.nameId) {
      throw new Error('Invalid SAML Assertion: missing identity attributes');
    }
    const key = `${tenantId}:${assertion.email.toLowerCase()}`;
    const existing = this.existingUsers.get(key);
    if (existing) {
      return {
        ...existing,
        isNew: false
      };
    }

    const role = assertion.groups.includes('Admins') ? 'admin' : 'member';
    const newUser: ProvisionedUser = {
      userId: `usr_${Math.random().toString(36).substring(2, 10)}`,
      email: assertion.email.toLowerCase(),
      name: `${assertion.firstName} ${assertion.lastName}`.trim(),
      tenantId,
      role,
      isNew: true
    };
    this.existingUsers.set(key, newUser);
    return newUser;
  }
}
