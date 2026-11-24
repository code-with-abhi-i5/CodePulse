import { Injectable, Logger } from '@nestjs/common';

export interface TopicPartition {
  topic: string;
  partition: number;
}

export interface MemberSubscription {
  memberId: string;
  topics: string[];
  previousAssignment?: TopicPartition[];
  generationId?: number;
}

export interface CooperativeAssignmentResult {
  generationId: number;
  assignments: Record<string, TopicPartition[]>;
  revocations: Record<string, TopicPartition[]>;
  additions: Record<string, TopicPartition[]>;
  unassignedPartitions: TopicPartition[];
  totalMigrations: number;
  isBalanced: boolean;
  rebalanceLatencyMs: number;
}

@Injectable()
export class StickyAssignorService {
  private readonly logger = new Logger(StickyAssignorService.name);

  /**
   * Computes cooperative sticky partition assignments.
   * Guarantees minimal partition reassignment and avoids stop-the-world pauses.
   */
  public computeCooperativeAssignment(
    members: MemberSubscription[],
    topicPartitionCounts: Record<string, number>,
    generationId: number,
  ): CooperativeAssignmentResult {
    const startTime = performance.now();

    if (members.length === 0) {
      return {
        generationId,
        assignments: {},
        revocations: {},
        additions: {},
        unassignedPartitions: [],
        totalMigrations: 0,
        isBalanced: true,
        rebalanceLatencyMs: 0,
      };
    }

    // 1. Enumerate all partitions across topics
    const allPartitions: TopicPartition[] = [];
    for (const [topic, count] of Object.entries(topicPartitionCounts)) {
      for (let p = 0; p < count; p++) {
        allPartitions.push({ topic, partition: p });
      }
    }

    const partitionKey = (tp: TopicPartition) => `${tp.topic}:${tp.partition}`;
    const allPartitionKeys = new Set(allPartitions.map(partitionKey));

    // 2. Identify previous assignments and active member sets
    const memberMap = new Map<string, MemberSubscription>();
    const currentAssignments = new Map<string, TopicPartition[]>();
    const revocations: Record<string, TopicPartition[]> = {};
    const additions: Record<string, TopicPartition[]> = {};

    for (const member of members) {
      memberMap.set(member.memberId, member);
      currentAssignments.set(member.memberId, []);
      revocations[member.memberId] = [];
      additions[member.memberId] = [];
    }

    // Retain valid previous assignments (stickiness)
    const assignedKeys = new Set<string>();
    for (const member of members) {
      if (member.previousAssignment && member.previousAssignment.length > 0) {
        const retained: TopicPartition[] = [];
        for (const tp of member.previousAssignment) {
          const key = partitionKey(tp);
          // Only retain if partition exists, topic is subscribed, and not already assigned
          if (
            allPartitionKeys.has(key) &&
            member.topics.includes(tp.topic) &&
            !assignedKeys.has(key)
          ) {
            retained.push(tp);
            assignedKeys.add(key);
          }
        }
        currentAssignments.set(member.memberId, retained);
      }
    }

    // 3. Compute target balancing thresholds
    const totalPartitions = allPartitions.length;
    const memberCount = members.length;
    const minQuota = Math.floor(totalPartitions / memberCount);
    const maxQuota = Math.ceil(totalPartitions / memberCount);

    // 4. Phase 1 - Cooperative Revocation:
    // Revoke excess partitions from over-allocated members without revoking balanced ones
    for (const [memberId, assigned] of currentAssignments.entries()) {
      if (assigned.length > maxQuota) {
        const excessCount = assigned.length - maxQuota;
        const toRevoke = assigned.splice(assigned.length - excessCount, excessCount);
        for (const tp of toRevoke) {
          assignedKeys.delete(partitionKey(tp));
          revocations[memberId].push(tp);
        }
      }
    }

    // 5. Phase 2 - Assignment of Unassigned Partitions
    const unassignedList: TopicPartition[] = allPartitions.filter(
      (tp) => !assignedKeys.has(partitionKey(tp)),
    );

    // Sort members by ascending assigned count to fill under-allocated members first
    const getSortedMembers = () =>
      Array.from(currentAssignments.entries()).sort(
        (a, b) => a[1].length - b[1].length,
      );

    for (const tp of unassignedList) {
      const eligibleMembers = getSortedMembers().filter(([memberId]) =>
        memberMap.get(memberId)!.topics.includes(tp.topic),
      );

      if (eligibleMembers.length > 0) {
        const targetMemberId = eligibleMembers[0][0];
        currentAssignments.get(targetMemberId)!.push(tp);
        additions[targetMemberId].push(tp);
        assignedKeys.add(partitionKey(tp));
      }
    }

    const remainingUnassigned = allPartitions.filter(
      (tp) => !assignedKeys.has(partitionKey(tp)),
    );

    // 6. Compute metrics
    let totalMigrations = 0;
    for (const member of members) {
      totalMigrations += additions[member.memberId].length;
    }

    const assignmentsRecord: Record<string, TopicPartition[]> = {};
    for (const [memberId, assigned] of currentAssignments.entries()) {
      assignmentsRecord[memberId] = [...assigned];
    }

    const isBalanced = Array.from(currentAssignments.values()).every(
      (list) => list.length >= minQuota && list.length <= maxQuota,
    );

    const rebalanceLatencyMs = Math.round((performance.now() - startTime) * 100) / 100;

    this.logger.debug(
      `Cooperative assignment computed for generation ${generationId}: ` +
        `${totalMigrations} migrations across ${memberCount} members in ${rebalanceLatencyMs}ms`,
    );

    return {
      generationId,
      assignments: assignmentsRecord,
      revocations,
      additions,
      unassignedPartitions: remainingUnassigned,
      totalMigrations,
      isBalanced,
      rebalanceLatencyMs,
    };
  }
}
