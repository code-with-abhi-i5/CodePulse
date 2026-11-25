/**
 * Architecture Service: Monaco Regex Search and Replace
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-56]
 */

export interface RegexMatch {
  index: number;
  matchText: string;
  groups: string[];
  previewReplacement: string;
}

export class MonacoRegexSearchReplaceService {
  public findMatches(text: string, pattern: string, replacementTemplate: string, caseSensitive: boolean = true): RegexMatch[] {
    const flags = caseSensitive ? 'g' : 'gi';
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags);
    } catch {
      return [];
    }

    const matches: RegexMatch[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const matchText = m[0];
      const groups = m.slice(1);
      const preview = this.computeReplacement(m, replacementTemplate);
      matches.push({
        index: m.index,
        matchText,
        groups,
        previewReplacement: preview
      });
      if (!flags.includes('g') || matchText.length === 0) break;
    }
    return matches;
  }

  public computeReplacement(match: RegExpExecArray, template: string): string {
    return template.replace(/\$(\d+)/g, (_, groupIdx) => {
      const idx = parseInt(groupIdx, 10);
      return match[idx] !== undefined ? match[idx] : '';
    });
  }

  public replaceAll(text: string, pattern: string, replacementTemplate: string, caseSensitive: boolean = true): string {
    const flags = caseSensitive ? 'g' : 'gi';
    try {
      const regex = new RegExp(pattern, flags);
      return text.replace(regex, (...args) => {
        const match = args[0];
        const offset = args[args.length - 2];
        const fullStr = args[args.length - 1];
        // Construct array like exec result
        const groups = args.slice(1, -2);
        const matchArray = [match, ...groups] as any;
        return this.computeReplacement(matchArray, replacementTemplate);
      });
    } catch {
      return text;
    }
  }
}
