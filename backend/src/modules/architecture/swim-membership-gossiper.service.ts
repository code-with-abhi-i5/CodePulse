export type MemberStatus = 'ALIVE' | 'SUSPECT' | 'DEAD';

export interface MemberNode {
  id: string;
  address: string;
  port: number;
  status: MemberStatus;
  incarnation: number;
  lastUpdated: number;
}

export interface GossipMessage {
  type: 'PING' | 'ACK' | 'PING_REQ' | 'GOSSIP_UPDATE';
  senderId: string;
  targetId?: string;
  incarnation: number;
  members: MemberNode[];
}

export class SWIMMembershipGossiperService {
  private members = new Map<string, MemberNode>();
  private readonly localNodeId: string;
  private localIncarnation = 0;
  private suspectTimeoutMs: number;

  constructor(localNodeId: string, address = '127.0.0.1', port = 9000, suspectTimeoutMs = 5000) {
    this.localNodeId = localNodeId;
    this.suspectTimeoutMs = suspectTimeoutMs;
    this.members.set(localNodeId, {
      id: localNodeId,
      address,
      port,
      status: 'ALIVE',
      incarnation: this.localIncarnation,
      lastUpdated: Date.now()
    });
  }

  public registerMember(id: string, address: string, port: number): void {
    if (id === this.localNodeId) return;
    this.members.set(id, {
      id,
      address,
      port,
      status: 'ALIVE',
      incarnation: 0,
      lastUpdated: Date.now()
    });
  }

  public markSuspect(nodeId: string, incarnation: number): void {
    const member = this.members.get(nodeId);
    if (!member || member.status === 'DEAD') return;

    if (nodeId === this.localNodeId) {
      // Local node was falsely suspected: refute with higher incarnation
      this.localIncarnation = Math.max(this.localIncarnation, incarnation) + 1;
      member.incarnation = this.localIncarnation;
      member.status = 'ALIVE';
      member.lastUpdated = Date.now();
      return;
    }

    if (incarnation >= member.incarnation) {
      member.status = 'SUSPECT';
      member.incarnation = incarnation;
      member.lastUpdated = Date.now();
    }
  }

  public markDead(nodeId: string): void {
    const member = this.members.get(nodeId);
    if (member && nodeId !== this.localNodeId) {
      member.status = 'DEAD';
      member.lastUpdated = Date.now();
    }
  }

  public processGossipUpdates(updates: MemberNode[]): void {
    const now = Date.now();
    for (const update of updates) {
      if (update.id === this.localNodeId) {
        if (update.status === 'SUSPECT' && update.incarnation >= this.localIncarnation) {
          // Refute suspicion
          this.localIncarnation = update.incarnation + 1;
          const self = this.members.get(this.localNodeId)!;
          self.incarnation = this.localIncarnation;
          self.status = 'ALIVE';
          self.lastUpdated = now;
        }
        continue;
      }

      const existing = this.members.get(update.id);
      if (!existing) {
        this.members.set(update.id, { ...update, lastUpdated: now });
        continue;
      }

      if (update.incarnation > existing.incarnation) {
        existing.status = update.status;
        existing.incarnation = update.incarnation;
        existing.lastUpdated = now;
      } else if (update.incarnation === existing.incarnation) {
        if (existing.status === 'ALIVE' && update.status === 'SUSPECT') {
          existing.status = 'SUSPECT';
          existing.lastUpdated = now;
        } else if (update.status === 'DEAD') {
          existing.status = 'DEAD';
          existing.lastUpdated = now;
        }
      }
    }
  }

  public getAliveMembers(): MemberNode[] {
    return Array.from(this.members.values()).filter(m => m.status === 'ALIVE');
  }

  public getMember(id: string): MemberNode | undefined {
    return this.members.get(id);
  }

  public checkSuspectTimeouts(now = Date.now()): string[] {
    const expired: string[] = [];
    for (const member of this.members.values()) {
      if (member.status === 'SUSPECT' && (now - member.lastUpdated) > this.suspectTimeoutMs) {
        member.status = 'DEAD';
        member.lastUpdated = now;
        expired.push(member.id);
      }
    }
    return expired;
  }
}
