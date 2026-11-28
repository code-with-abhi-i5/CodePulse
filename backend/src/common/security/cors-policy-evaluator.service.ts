import { CorsEvaluationResult } from '../../types/security';

export class CorsPolicyEvaluatorService {
  constructor(
    private readonly allowedOrigins: string[] = ['https://codepulse.io', 'https://app.codepulse.io'],
    private readonly privatePathPrefix: string = '/api/private/'
  ) {}

  public evaluateOrigin(origin: string, requestPath: string, allowCredentials: boolean = true): CorsEvaluationResult {
    const isPrivatePath = requestPath.startsWith(this.privatePathPrefix);

    if (origin === '*' && allowCredentials) {
      return {
        isAllowed: false,
        origin,
        allowCredentials: false,
        allowHeaders: [],
        rejectionReason: 'Wildcard origin "*" is strictly forbidden with credentials enabled'
      };
    }

    if (isPrivatePath) {
      if (!this.allowedOrigins.includes(origin)) {
        return {
          isAllowed: false,
          origin,
          allowCredentials: false,
          allowHeaders: [],
          rejectionReason: `Origin "${origin}" is not authorized for private API endpoint ${requestPath}`
        };
      }
    }

    const isExplicitlyAllowed = this.allowedOrigins.includes(origin);

    return {
      isAllowed: isExplicitlyAllowed,
      origin,
      allowCredentials: isExplicitlyAllowed ? allowCredentials : false,
      allowHeaders: isExplicitlyAllowed ? ['Content-Type', 'Authorization', 'X-Requested-With'] : [],
      rejectionReason: isExplicitlyAllowed ? undefined : `Origin "${origin}" is not in CORS allowlist`
    };
  }
}
