import { Injectable, Logger } from '@nestjs/common';

export type TemplateCompileFunction = (context: Record<string, any>) => string;

@Injectable()
export class TemplateCompilerService {
  private readonly logger = new Logger(TemplateCompilerService.name);

  // In-memory compiled template cache
  private readonly templateCache = new Map<string, TemplateCompileFunction>();

  /**
   * Compiles dynamic Handlebars-compatible templates with variables, conditionals, and loops.
   */
  public compile(templateString: string): TemplateCompileFunction {
    const cached = this.templateCache.get(templateString);
    if (cached) return cached;

    const fn = (context: Record<string, any>): string => {
      let result = templateString;

      // 1. Process conditionals: {{#if condition}}...{{else}}...{{/if}} or {{#if condition}}...{{/if}}
      result = result.replace(/\{\{#if\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, key, truthyBody, falsyBody = '') => {
        const val = this.resolveValue(context, key);
        return val ? truthyBody : falsyBody;
      });

      // 2. Process loops: {{#each list}}...{{this}} or {{property}}...{{/each}}
      result = result.replace(/\{\{#each\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, itemBody) => {
        const list = this.resolveValue(context, key);
        if (!Array.isArray(list)) return '';

        return list.map((item, index) => {
          let itemResult = itemBody;
          if (typeof item === 'object' && item !== null) {
            itemResult = itemResult.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (__: string, prop: string) => {
              if (prop === '@index') return String(index);
              const propVal = this.resolveValue(item, prop);
              return propVal !== undefined ? this.escapeHtml(String(propVal)) : '';
            });
          } else {
            itemResult = itemResult.replace(/\{\{this\}\}/g, this.escapeHtml(String(item)));
            itemResult = itemResult.replace(/\{\{@index\}\}/g, String(index));
          }
          return itemResult;
        }).join('');
      });

      // 3. Process raw unescaped values: {{{rawVar}}}
      result = result.replace(/\{\{\{([a-zA-Z0-9_.]+)\}\}\}/g, (_, key) => {
        const val = this.resolveValue(context, key);
        return val !== undefined && val !== null ? String(val) : '';
      });

      // 4. Process standard escaped variables: {{var}}
      result = result.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, key) => {
        const val = this.resolveValue(context, key);
        return val !== undefined && val !== null ? this.escapeHtml(String(val)) : '';
      });

      return result;
    };

    this.templateCache.set(templateString, fn);
    return fn;
  }

  public render(templateString: string, context: Record<string, any>): string {
    const compiled = this.compile(templateString);
    return compiled(context);
  }

  public clearCache(): void {
    this.templateCache.clear();
  }

  private resolveValue(obj: any, path: string): any {
    if (!obj || typeof obj !== 'object') return undefined;
    const parts = path.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr === undefined || curr === null) return undefined;
      curr = curr[part];
    }
    return curr;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
