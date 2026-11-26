export interface BlameLine { line: number; commitHash: string; ageHours: number; heatIntensity: number; }
export class MonacoMinimapGitBlameService_3795 {
  public calculateHeat(ageHours: number): number {
    return Math.max(0.1, Number((1 / (1 + ageHours / 24)).toFixed(2)));
  }
  public buildHeatmap(commits: { line: number; commitHash: string; ageHours: number }[]): BlameLine[] {
    return commits.map(c => ({ ...c, heatIntensity: this.calculateHeat(c.ageHours) }));
  }
}