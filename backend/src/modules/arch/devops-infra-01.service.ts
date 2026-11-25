/**
 * Architecture Service: BuildKit Cache Mount Optimizer & Dockerfile Validator
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-01]
 */

export interface DockerStageAnalysis {
  stageName: string;
  baseImage: string;
  hasCacheMount: boolean;
  hasPnpmStoreMount: boolean;
  instructionCount: number;
}

export class BuildkitCacheMountOptimizerService {
  public analyzeDockerfile(dockerfileContent: string): { stages: DockerStageAnalysis[]; isOptimized: boolean } {
    const lines = dockerfileContent.split('\n').map(l => l.trim());
    const stages: DockerStageAnalysis[] = [];
    let currentStage: DockerStageAnalysis | null = null;

    for (const line of lines) {
      if (line.startsWith('#') || !line) continue;

      if (line.toUpperCase().startsWith('FROM ')) {
        if (currentStage) stages.push(currentStage);
        const parts = line.split(/\s+/);
        const baseImage = parts[1] || '';
        const stageName = parts.length >= 4 && parts[2].toUpperCase() === 'AS' ? parts[3] : 'stage_' + stages.length;
        currentStage = {
          stageName,
          baseImage,
          hasCacheMount: false,
          hasPnpmStoreMount: false,
          instructionCount: 1
        };
        continue;
      }

      if (currentStage) {
        currentStage.instructionCount++;
        if (line.includes('--mount=type=cache')) {
          currentStage.hasCacheMount = true;
          if (line.includes('pnpm') || line.includes('.pnpm-store')) {
            currentStage.hasPnpmStoreMount = true;
          }
        }
      }
    }

    if (currentStage) stages.push(currentStage);

    const isOptimized = stages.some(s => s.hasCacheMount && s.hasPnpmStoreMount);
    return { stages, isOptimized };
  }

  public generateOptimizedSnippet(): string {
    return 'RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile';
  }
}
