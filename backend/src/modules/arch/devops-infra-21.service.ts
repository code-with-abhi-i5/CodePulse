/**
 * Architecture Service: Docker Image Size Optimizer
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-21]
 */

export interface LayerInspectionResult {
  unnecessaryPatternsFound: string[];
  estimatedWastedBytes: number;
  optimizationTips: string[];
}

export class DockerImageSizeOptimizerService {
  private static readonly BLOAT_PATTERNS = [
    { pattern: /\.git/i, name: '.git metadata directory', wastedBytes: 50000000 },
    { pattern: /node_modules\/.*\/(README|CHANGELOG|test|tests)\.md/i, name: 'npm package docs and test suites', wastedBytes: 15000000 },
    { pattern: /\.ts$/i, name: 'uncompiled typescript source files in prod image', wastedBytes: 10000000 },
    { pattern: /pnpm-cache/i, name: 'uncleaned pnpm store cache', wastedBytes: 40000000 }
  ];

  public inspectLayerFiles(filePaths: string[]): LayerInspectionResult {
    const found: Set<string> = new Set();
    let wasted = 0;

    for (const file of filePaths) {
      for (const bloat of DockerImageSizeOptimizerService.BLOAT_PATTERNS) {
        if (bloat.pattern.test(file)) {
          if (!found.has(bloat.name)) {
            found.add(bloat.name);
            wasted += bloat.wastedBytes;
          }
        }
      }
    }

    const tips: string[] = [];
    if (found.has('.git metadata directory')) tips.push('Add .git to .dockerignore');
    if (found.has('uncompiled typescript source files in prod image')) tips.push('Use multi-stage builds and copy only dist/ output');
    if (found.has('uncleaned pnpm store cache')) tips.push('Use BuildKit cache mounts instead of storing inside image layers');

    return {
      unnecessaryPatternsFound: Array.from(found),
      estimatedWastedBytes: wasted,
      optimizationTips: tips
    };
  }
}
