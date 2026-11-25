/**
 * Architecture Service: Challenge Dependency Graph
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-57]
 */

export interface ChallengeNode {
  id: string;
  title: string;
  prerequisites: string[];
}

export class ChallengeDependencyGraphService {
  private nodes: Map<string, ChallengeNode>;

  constructor() {
    this.nodes = new Map();
  }

  public addChallenge(node: ChallengeNode): void {
    this.nodes.set(node.id, node);
  }

  public detectCycle(): boolean {
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      inStack.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        for (const prereq of node.prerequisites) {
          if (!visited.has(prereq)) {
            if (dfs(prereq)) return true;
          } else if (inStack.has(prereq)) {
            return true;
          }
        }
      }

      inStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) return true;
      }
    }
    return false;
  }

  public getUnlockedChallenges(completedChallengeIds: string[]): ChallengeNode[] {
    const completedSet = new Set(completedChallengeIds);
    const unlocked: ChallengeNode[] = [];

    for (const node of this.nodes.values()) {
      if (completedSet.has(node.id)) continue;
      const allMet = node.prerequisites.every(p => completedSet.has(p));
      if (allMet) {
        unlocked.push(node);
      }
    }
    return unlocked;
  }
}
