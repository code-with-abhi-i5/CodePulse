/**
 * Architecture Service: Monaco Bracket Pair Colorizer
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-29]
 */

export interface BracketMatch {
  openIndex: number;
  closeIndex: number;
  bracketType: '()' | '[]' | '{}';
  depth: number;
  colorIndex: number;
}

export class BracketPairColorizerService {
  private colors: string[] = ['#ffd700', '#da70d6', '#179fff'];

  public colorizeBrackets(code: string): BracketMatch[] {
    const matches: BracketMatch[] = [];
    const stack: Array<{ char: string; index: number; depth: number }> = [];

    const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
    const bracketTypes: Record<string, '()' | '[]' | '{}'> = {
      '(': '()', ')': '()',
      '[': '[]', ']': '[]',
      '{': '{}', '}': '{}'
    };

    let depth = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      if (char === '(' || char === '[' || char === '{') {
        stack.push({ char, index: i, depth });
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        const expectedOpen = pairs[char];
        if (stack.length > 0 && stack[stack.length - 1].char === expectedOpen) {
          const open = stack.pop()!;
          depth--;
          matches.push({
            openIndex: open.index,
            closeIndex: i,
            bracketType: bracketTypes[char],
            depth: open.depth,
            colorIndex: open.depth % this.colors.length
          });
        }
      }
    }

    return matches;
  }
}
