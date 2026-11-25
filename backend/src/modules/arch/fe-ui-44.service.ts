/**
 * Architecture Service: Web Worker Markdown Compiler
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-44]
 */

export interface CompiledMarkdown {
  html: string;
  hasMath: boolean;
  codeBlocksCount: number;
}

export class WebWorkerMarkdownCompilerService {
  private cache: Map<string, CompiledMarkdown>;

  constructor() {
    this.cache = new Map();
  }

  public compile(markdown: string): CompiledMarkdown {
    if (this.cache.has(markdown)) {
      return this.cache.get(markdown)!;
    }

    let hasMath = false;
    let codeBlocksCount = 0;

    let html = markdown
      // Headings
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold & Italic
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Code blocks with syntax tokenization simulation
    html = html.replace(/\`\`\`([a-z]*)\n([\s\S]*?)\`\`\`/gm, (_, lang, code) => {
      codeBlocksCount++;
      return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
    });

    // Math expressions ($...$)
    html = html.replace(/\$([^$]+)\$/gm, (_, expr) => {
      hasMath = true;
      return `<span class="katex-math">${expr}</span>`;
    });

    const result: CompiledMarkdown = {
      html,
      hasMath,
      codeBlocksCount
    };

    this.cache.set(markdown, result);
    return result;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}
