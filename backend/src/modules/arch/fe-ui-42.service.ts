/**
 * Architecture Service: Monaco Inline Ghost-Text Autocomplete
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-42]
 */

export interface GhostTextSuggestion {
  id: string;
  lineNumber: number;
  column: number;
  text: string;
  prefix: string;
}

export class InlineGhostTextAutocompleteService {
  private activeSuggestion: GhostTextSuggestion | null;

  constructor() {
    this.activeSuggestion = null;
  }

  public setSuggestion(lineNumber: number, column: number, text: string, prefix: string): GhostTextSuggestion {
    this.activeSuggestion = {
      id: `sug_${Date.now()}`,
      lineNumber,
      column,
      text,
      prefix
    };
    return this.activeSuggestion;
  }

  public getGhostText(currentLine: number, currentCol: number, currentPrefix: string): string | null {
    if (!this.activeSuggestion) return null;
    if (this.activeSuggestion.lineNumber !== currentLine) return null;
    if (!this.activeSuggestion.text.startsWith(currentPrefix)) return null;

    const remaining = this.activeSuggestion.text.slice(currentPrefix.length);
    return remaining.length > 0 ? remaining : null;
  }

  public acceptFull(): string | null {
    if (!this.activeSuggestion) return null;
    const text = this.activeSuggestion.text;
    this.activeSuggestion = null;
    return text;
  }

  public acceptWord(currentAcceptedLength: number): string | null {
    if (!this.activeSuggestion) return null;
    const remaining = this.activeSuggestion.text.slice(currentAcceptedLength);
    const words = remaining.split(/(\s+|[^a-zA-Z0-9_]+)/);
    const nextToken = words[0] || '';
    return nextToken;
  }

  public dismiss(): void {
    this.activeSuggestion = null;
  }
}
