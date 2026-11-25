/**
 * Architecture Service: High-Speed Regex Matcher Engine
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-35]
 */

export interface PrecompiledPattern {
  id: string;
  rawPattern: string;
  regex: RegExp;
  isSafeDfa: boolean;
  matchCount: number;
}

export class HighSpeedRegexMatcherService {
  private cache: Map<string, PrecompiledPattern>;

  constructor() {
    this.cache = new Map();
  }

  public register(id: string, pattern: string, flags: string = 'g'): boolean {
    const isSafe = this.isPatternSafe(pattern);
    try {
      const regex = new RegExp(pattern, flags);
      this.cache.set(id, {
        id,
        rawPattern: pattern,
        regex,
        isSafeDfa: isSafe,
        matchCount: 0
      });
      return true;
    } catch {
      return false;
    }
  }

  public isPatternSafe(pattern: string): boolean {
    const dangerousNested = /(\([^)]*[+*][^)]*\)[+*])|([+*]{2,})/;
    return !dangerousNested.test(pattern);
  }

  public match(id: string, input: string): { matched: boolean; matches: string[] } {
    const compiled = this.cache.get(id);
    if (!compiled) {
      throw new Error('Pattern not registered: ' + id);
    }

    compiled.matchCount++;
    compiled.regex.lastIndex = 0;
    const matches = input.match(compiled.regex) || [];
    return {
      matched: matches.length > 0,
      matches: Array.from(matches)
    };
  }

  public getPattern(id: string): PrecompiledPattern | undefined {
    return this.cache.get(id);
  }

  public clear(): void {
    this.cache.clear();
  }
}
