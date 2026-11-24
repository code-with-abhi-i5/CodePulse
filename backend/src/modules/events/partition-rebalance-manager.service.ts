import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {
  StickyAssignorService,
  TopicPartition,
  MemberSubscription,
  CooperativeAssignmentResult,
} from './sticky-assignor.service';

export enum ConsumerGroupState {
  STABLE = 'STABLE',
  PREPARING_REBALANCE = 'PREPARING_REBALANCE',
  COMPLETING_REBALANCE = 'COMPLETING_REBALANCE',
  DEAD = 'DEAD',
}

export interface ConsumerMemberRecord {
  memberId: string;
  clientId: string;
  subscribedTopics: string[];
  assignedPartitions: TopicPartition[];
  lastHeartbeatTimestamp: number;
  sessionTimeoutMs: number;
}

export interface RebalanceTelemetrySnapshot {
  groupId: string;
  state: ConsumerGroupState;
  generationId: number;
  activeMembersCount: number;
  totalPartitionsAssigned: number;
  lastRebalanceDurationMs: number;
  totalRebalancesExecuted: number;
  totalPartitionsMigrated: number;
  averageRebalancePauseMs: number;
}

@Injectable()
export class PartitionRebalanceManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PartitionRebalanceManagerService.name);
  private state: ConsumerGroupState = ConsumerGroupState.STABLE;
  private generationId = 0;
  private readonly groupId = 'codepulse-primary-event-consumers';
  private readonly members = new Map<string, ConsumerMemberRecord>();
  private readonly topicPartitions = new Map<string, number>();
  private heartbeatWatchdogTimer?: NodeJS.Timeout;

  // Performance telemetry
  private totalRebalances = 0;
  private totalMigrations = 0;
  private lastRebalanceDuration = 0;
  private readonly rebalanceLatencies: number[] = [];

  constructor(private readonly stickyAssignor: StickyAssignorService) {}

  onModuleInit(): void {
    this.logger.log(`Initializing PartitionRebalanceManager for group '${this.groupId}'`);
    // Default initial topics
    this.topicPartitions.set('battle.events', 8);
    this.topicPartitions.set('telemetry.keystrokes', 16);
    this.topicPartitions.set('user.notifications', 4);

    // Watchdog checking expired member heartbeats every 2000ms
    this.heartbeatWatchdogTimer = setInterval(() => {
      this.checkMemberHeartbeats();
    }, 2000);
  }

  onModuleDestroy(): void {
    if (this.heartbeatWatchdogTimer) {
      clearInterval(this.heartbeatWatchdogTimer);
    }
    this.state = ConsumerGroupState.DEAD;
    this.members.clear();
  }

  public registerTopic(topic: string, partitionCount: number): void {
    this.topicPartitions.set(topic, partitionCount);
  }

  public registerMember(
    memberId: string,
    clientId: string,
    subscribedTopics: string[],
    sessionTimeoutMs = 10000,
  ): CooperativeAssignmentResult {
    const existing = this.members.get(memberId);
    const previousAssignment = existing ? existing.assignedPartitions : [];

    const member: ConsumerMemberRecord = {
      memberId,
      clientId,
      subscribedTopics,
      assignedPartitions: previousAssignment,
      lastHeartbeatTimestamp: Date.now(),
      sessionTimeoutMs,
    };

    this.members.set(memberId, member);
    this.logger.log(`Member '${memberId}' joined group '${this.groupId}'. Triggering cooperative rebalance.`);

    return this.triggerRebalance();
  }

  public leaveMember(memberId: string): CooperativeAssignmentResult {
    if (!this.members.has(memberId)) {
      this.logger.warn(`Attempted to remove non-existent member '${memberId}'`);
      return this.getCurrentAssignmentState();
    }

    this.members.delete(memberId);
    this.logger.log(`Member '${memberId}' gracefully left group '${this.groupId}'.`);
    return this.triggerRebalance();
  }

  public recordHeartbeat(memberId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) {
      return false;
    }
    member.lastHeartbeatTimestamp = Date.now();
    return true;
  }

  public getMemberAssignment(memberId: string): TopicPartition[] {
    const member = this.members.get(memberId);
    return member ? [...member.assignedPartitions] : [];
  }

  public getTelemetry(): RebalanceTelemetrySnapshot {
    const totalAssigned = Array.from(this.members.values()).reduce(
      (sum, m) => sum + m.assignedPartitions.length,
      0,
    );

    const avgDuration =
      this.rebalanceLatencies.length > 0
        ? this.rebalanceLatencies.reduce((a, b) => a + b, 0) /
          this.rebalanceLatencies.length
        : 0;

    return {
      groupId: this.groupId,
      state: this.state,
      generationId: this.generationId,
      activeMembersCount: this.members.size,
      totalPartitionsAssigned: totalAssigned,
      lastRebalanceDurationMs: this.lastRebalanceDuration,
      totalRebalancesExecuted: this.totalRebalances,
      totalPartitionsMigrated: this.totalMigrations,
      averageRebalancePauseMs: Math.round(avgDuration * 100) / 100,
    };
  }

  private triggerRebalance(): CooperativeAssignmentResult {
    const startTime = performance.now();
    this.state = ConsumerGroupState.PREPARING_REBALANCE;
    this.generationId++;

    const memberSubscriptions: MemberSubscription[] = Array.from(
      this.members.values(),
    ).map((m) => ({
      memberId: m.memberId,
      topics: m.subscribedTopics,
      previousAssignment: m.assignedPartitions,
      generationId: this.generationId,
    }));

    const topicPartitionCountsRecord: Record<string, number> = {};
    for (const [topic, count] of this.topicPartitions.entries()) {
      topicPartitionCountsRecord[topic] = count;
    }

    // Phase 1 & 2 computed cooperatively via Sticky Assignor
    const plan = this.stickyAssignor.computeCooperativeAssignment(
      memberSubscriptions,
      topicPartitionCountsRecord,
      this.generationId,
    );

    // Apply assignments to member state
    for (const [memberId, partitions] of Object.entries(plan.assignments)) {
      const member = this.members.get(memberId);
      if (member) {
        member.assignedPartitions = [...partitions];
      }
    }

    this.state = ConsumerGroupState.STABLE;
    this.totalRebalances++;
    this.totalMigrations += plan.totalMigrations;

    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    this.lastRebalanceDuration = duration;
    this.rebalanceLatencies.push(duration);

    if (this.rebalanceLatencies.length > 100) {
      this.rebalanceLatencies.shift();
    }

    this.logger.log(
      `Rebalance generation ${this.generationId} complete: ` +
        `duration=${duration}ms (SLA <250ms met: ${duration < 250}) ` +
        `migrations=${plan.totalMigrations}`,
    );

    return plan;
  }

  private checkMemberHeartbeats(): void {
    const now = Date.now();
    const expiredMembers: string[] = [];

    for (const [memberId, member] of this.members.entries()) {
      if (now - member.lastHeartbeatTimestamp > member.sessionTimeoutMs) {
        expiredMembers.push(memberId);
      }
    }

    if (expiredMembers.length > 0) {
      this.logger.warn(
        `Evicting ${expiredMembers.length} dead consumer members due to heartbeat timeout: ${expiredMembers.join(', ')}`,
      );
      for (const id of expiredMembers) {
        this.members.delete(id);
      }
      this.triggerRebalance();
    }
  }

  private getCurrentAssignmentState(): CooperativeAssignmentResult {
    const assignments: Record<string, TopicPartition[]> = {};
    for (const [memberId, member] of this.members.entries()) {
      assignments[memberId] = [...member.assignedPartitions];
    }

    return {
      generationId: this.generationId,
      assignments,
      revocations: {},
      additions: {},
      unassignedPartitions: [],
      totalMigrations: 0,
      isBalanced: true,
      rebalanceLatencyMs: 0,
    };
  }
}
