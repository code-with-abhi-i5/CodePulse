/**
 * Architecture Service: Semantic Release Workflow & Changelog Generator
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-04]
 */

export interface ReleaseCommit {
  type: string;
  scope?: string;
  subject: string;
  isBreaking: boolean;
}

export class SemanticReleaseWorkflowService {
  public parseCommit(msg: string): ReleaseCommit {
    const lines = msg.trim().split('\n');
    const firstLine = lines[0];
    const isBreaking = msg.includes('BREAKING CHANGE') || firstLine.includes('!:');

    const match = firstLine.match(/^(\w+)(?:\(([^)]+)\))?!?\s*:\s*(.*)$/);
    if (!match) {
      return { type: 'chore', subject: firstLine, isBreaking };
    }

    return {
      type: match[1],
      scope: match[2],
      subject: match[3],
      isBreaking
    };
  }

  public calculateNextVersion(currentVersion: string, commits: ReleaseCommit[]): { nextVersion: string; bumpType: 'major' | 'minor' | 'patch' | 'none' } {
    const [maj, min, pat] = currentVersion.split('.').map(Number);
    let bump: 'major' | 'minor' | 'patch' | 'none' = 'none';

    for (const c of commits) {
      if (c.isBreaking) {
        bump = 'major';
        break;
      }
      if (c.type === 'feat' && bump !== 'major') {
        bump = 'minor';
      } else if (c.type === 'fix' && bump === 'none') {
        bump = 'patch';
      }
    }

    if (bump === 'major') return { nextVersion: (maj + 1) + '.0.0', bumpType: 'major' };
    if (bump === 'minor') return { nextVersion: maj + '.' + (min + 1) + '.0', bumpType: 'minor' };
    if (bump === 'patch') return { nextVersion: maj + '.' + min + '.' + (pat + 1), bumpType: 'patch' };
    return { nextVersion: currentVersion, bumpType: 'none' };
  }

  public generateChangelog(version: string, commits: ReleaseCommit[]): string {
    const feats = commits.filter(c => c.type === 'feat');
    const fixes = commits.filter(c => c.type === 'fix');

    let md = '# Release v' + version + '\n\n';
    if (feats.length > 0) {
      md += '### Features\n';
      for (const f of feats) md += '- ' + (f.scope ? '**' + f.scope + ':** ' : '') + f.subject + '\n';
      md += '\n';
    }
    if (fixes.length > 0) {
      md += '### Bug Fixes\n';
      for (const fx of fixes) md += '- ' + (fx.scope ? '**' + fx.scope + ':** ' : '') + fx.subject + '\n';
    }
    return md.trim();
  }
}
