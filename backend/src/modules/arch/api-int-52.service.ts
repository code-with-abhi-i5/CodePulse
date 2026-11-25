/**
 * Architecture Service: REST API HATEOAS Link Generator
 * Subsystem: Hypermedia Navigation & REST Maturity
 */

export interface HateoasLink {
  rel: string;
  href: string;
  method: string;
}

export class RestHateoasLinkGeneratorService {
  private readonly baseUrl: string;

  constructor(baseUrl = 'https://api.codepulse.io') {
    this.baseUrl = baseUrl;
  }

  public enrichChallenge<T extends Record<string, unknown>>(challenge: T): T & { _links: Record<string, HateoasLink> } {
    const id = challenge.id;
    return {
      ...challenge,
      _links: {
        self: { rel: 'self', href: `${this.baseUrl}/challenges/${id}`, method: 'GET' },
        submit: { rel: 'submit', href: `${this.baseUrl}/challenges/${id}/submissions`, method: 'POST' },
        leaderboard: { rel: 'leaderboard', href: `${this.baseUrl}/challenges/${id}/leaderboard`, method: 'GET' }
      }
    };
  }
}
