/**
 * Architecture Service: Monaco AST Breadcrumbs Bar
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-59]
 */

export interface AstScope {
  id: string;
  name: string;
  kind: 'module' | 'class' | 'function' | 'block';
  startLine: number;
  endLine: number;
  children?: AstScope[];
}

export class MonacoAstBreadcrumbsService {
  private rootScopes: AstScope[];

  constructor(scopes: AstScope[] = []) {
    this.rootScopes = scopes;
  }

  public setScopes(scopes: AstScope[]): void {
    this.rootScopes = scopes;
  }

  public getBreadcrumbChain(lineNumber: number): AstScope[] {
    const chain: AstScope[] = [];

    const search = (scopes: AstScope[]): boolean => {
      for (const s of scopes) {
        if (lineNumber >= s.startLine && lineNumber <= s.endLine) {
          chain.push(s);
          if (s.children && s.children.length > 0) {
            search(s.children);
          }
          return true;
        }
      }
      return false;
    };

    search(this.rootScopes);
    return chain;
  }

  public formatBreadcrumbString(lineNumber: number): string {
    const chain = this.getBreadcrumbChain(lineNumber);
    if (chain.length === 0) return 'global';
    return chain.map(c => c.name).join(' > ');
  }
}
