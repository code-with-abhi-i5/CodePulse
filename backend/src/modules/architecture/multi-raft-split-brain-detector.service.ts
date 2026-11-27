export interface RaftNodeState {
  nodeId: string;
  groupId: string;
  term: number;
  isLeader: boolean;
  lastHeartbeat: number;
}

export class MultiRaftSplitBrainDetector {
  private nodeStates = new Map<string, RaftNodeState>();

  public reportHeartbeat(state: RaftNodeState): void {
    this.nodeStates.set(`${state.groupId}_${state.nodeId}`, state);
  }

  public detectSplitBrain(groupId: string, totalNodesInGroup: number): { splitBrain: boolean; leaders: string[] } {
    const groupMembers = Array.from(this.nodeStates.values()).filter(s => s.groupId === groupId);
    const activeLeaders = groupMembers.filter(s => s.isLeader);

    if (activeLeaders.length > 1) {
      return {
        splitBrain: true,
        leaders: activeLeaders.map(l => l.nodeId)
      };
    }

    return { splitBrain: false, leaders: activeLeaders.map(l => l.nodeId) };
  }
}
