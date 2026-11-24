import { StickyAssignorService } from './sticky-assignor.service';
import {
  PartitionRebalanceManagerService,
  ConsumerGroupState,
} from './partition-rebalance-manager.service';

describe('Zero-Downtime Kafka Cooperative Sticky Partition Rebalancer (#1406)', () => {
  let assignor: StickyAssignorService;
  let manager: PartitionRebalanceManagerService;

  beforeEach(() => {
    assignor = new StickyAssignorService();
    manager = new PartitionRebalanceManagerService(assignor);
    manager.onModuleInit();
  });

  afterEach(() => {
    manager.onModuleDestroy();
  });

  describe('StickyAssignorService Core Algorithm', () => {
    it('distributes 12 partitions evenly across 3 initial consumer members', () => {
      const topicPartitions = { 'events.battles': 12 };
      const members = [
        { memberId: 'worker-1', topics: ['events.battles'] },
        { memberId: 'worker-2', topics: ['events.battles'] },
        { memberId: 'worker-3', topics: ['events.battles'] },
      ];

      const result = assignor.computeCooperativeAssignment(members, topicPartitions, 1);

      expect(result.isBalanced).toBe(true);
      expect(result.totalMigrations).toBe(12);
      expect(result.assignments['worker-1'].length).toBe(4);
      expect(result.assignments['worker-2'].length).toBe(4);
      expect(result.assignments['worker-3'].length).toBe(4);
      expect(result.unassignedPartitions.length).toBe(0);
      expect(result.rebalanceLatencyMs).toBeLessThan(250);
    });

    it('minimizes partition movement when scaling up from 3 to 4 members (Sticky Guarantee)', () => {
      const topicPartitions = { 'events.battles': 12 };
      // Previous generation had 4 partitions each
      const previousMembers = [
        {
          memberId: 'worker-1',
          topics: ['events.battles'],
          previousAssignment: [
            { topic: 'events.battles', partition: 0 },
            { topic: 'events.battles', partition: 1 },
            { topic: 'events.battles', partition: 2 },
            { topic: 'events.battles', partition: 3 },
          ],
        },
        {
          memberId: 'worker-2',
          topics: ['events.battles'],
          previousAssignment: [
            { topic: 'events.battles', partition: 4 },
            { topic: 'events.battles', partition: 5 },
            { topic: 'events.battles', partition: 6 },
            { topic: 'events.battles', partition: 7 },
          ],
        },
        {
          memberId: 'worker-3',
          topics: ['events.battles'],
          previousAssignment: [
            { topic: 'events.battles', partition: 8 },
            { topic: 'events.battles', partition: 9 },
            { topic: 'events.battles', partition: 10 },
            { topic: 'events.battles', partition: 11 },
          ],
        },
        // New member joining without previous assignment
        {
          memberId: 'worker-4',
          topics: ['events.battles'],
          previousAssignment: [],
        },
      ];

      const result = assignor.computeCooperativeAssignment(previousMembers, topicPartitions, 2);

      expect(result.isBalanced).toBe(true);
      // Target quota for 12 partitions across 4 members = 3 partitions each
      expect(result.assignments['worker-1'].length).toBe(3);
      expect(result.assignments['worker-2'].length).toBe(3);
      expect(result.assignments['worker-3'].length).toBe(3);
      expect(result.assignments['worker-4'].length).toBe(3);

      // Crucial: Only 3 partitions migrated total (1 from each member to worker-4)!
      // 9 partitions remained untouched without stop-the-world pause!
      expect(result.totalMigrations).toBe(3);
      expect(result.revocations['worker-1'].length).toBe(1);
      expect(result.revocations['worker-2'].length).toBe(1);
      expect(result.revocations['worker-3'].length).toBe(1);
      expect(result.rebalanceLatencyMs).toBeLessThan(250);
    });

    it('gracefully reallocates partitions when a consumer member leaves', () => {
      const topicPartitions = { 'events.battles': 6 };
      // worker-1 leaves, worker-2 and worker-3 remain
      const remainingMembers = [
        {
          memberId: 'worker-2',
          topics: ['events.battles'],
          previousAssignment: [
            { topic: 'events.battles', partition: 2 },
            { topic: 'events.battles', partition: 3 },
          ],
        },
        {
          memberId: 'worker-3',
          topics: ['events.battles'],
          previousAssignment: [
            { topic: 'events.battles', partition: 4 },
            { topic: 'events.battles', partition: 5 },
          ],
        },
      ];

      const result = assignor.computeCooperativeAssignment(remainingMembers, topicPartitions, 3);

      expect(result.isBalanced).toBe(true);
      // 6 partitions / 2 members = 3 each
      expect(result.assignments['worker-2'].length).toBe(3);
      expect(result.assignments['worker-3'].length).toBe(3);
      // Previous assignments partitions 2,3 for worker-2 and 4,5 for worker-3 were retained
      expect(
        result.assignments['worker-2'].some((p) => p.partition === 2),
      ).toBe(true);
      expect(
        result.assignments['worker-3'].some((p) => p.partition === 4),
      ).toBe(true);
    });
  });

  describe('PartitionRebalanceManagerService State Machine & Telemetry', () => {
    it('manages member lifecycle and tracks rebalance telemetry', () => {
      manager.registerTopic('topic-alpha', 6);

      const res1 = manager.registerMember('m1', 'client-pod-1', ['topic-alpha']);
      expect(res1.generationId).toBe(1);
      expect(manager.getMemberAssignment('m1').length).toBe(6);

      const res2 = manager.registerMember('m2', 'client-pod-2', ['topic-alpha']);
      expect(res2.generationId).toBe(2);
      expect(manager.getMemberAssignment('m1').length).toBe(3);
      expect(manager.getMemberAssignment('m2').length).toBe(3);

      const telemetry = manager.getTelemetry();
      expect(telemetry.state).toBe(ConsumerGroupState.STABLE);
      expect(telemetry.activeMembersCount).toBe(2);
      expect(telemetry.totalRebalancesExecuted).toBe(2);
      expect(telemetry.lastRebalanceDurationMs).toBeLessThan(250);
    });

    it('records heartbeats and leaves members gracefully', () => {
      manager.registerTopic('topic-beta', 4);
      manager.registerMember('mA', 'client-pod-A', ['topic-beta']);

      expect(manager.recordHeartbeat('mA')).toBe(true);
      expect(manager.recordHeartbeat('non-existent-member')).toBe(false);

      const leaveResult = manager.leaveMember('mA');
      expect(leaveResult.generationId).toBe(2);
      expect(manager.getMemberAssignment('mA').length).toBe(0);
      expect(manager.getTelemetry().activeMembersCount).toBe(0);
    });
  });
});
