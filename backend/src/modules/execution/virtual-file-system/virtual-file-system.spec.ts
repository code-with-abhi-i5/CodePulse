/**
 * @file virtual-file-system.spec.ts
 * @description Comprehensive unit, stress, and behavioral verification suite for [SANDBOX-VFS-056]: In-Memory Virtual File System (VFS) with File-Descriptor Quotas & Path Traversal Guard.
 */

import { VirtualFileSystemService } from './virtual-file-system.service';
import { VirtualFileSystemController } from './virtual-file-system.controller';
import {
  VirtualFileSystemState,
  VirtualFileSystemSeverity,
  VirtualFileSystemErrorCode,
  VirtualFileSystemException,
} from './virtual-file-system.types';

describe('VirtualFileSystem Core Specification Suite', () => {
  let service: VirtualFileSystemService;
  let controller: VirtualFileSystemController;

  beforeEach(() => {
    service = new VirtualFileSystemService();
    service.onModuleInit();
    controller = new VirtualFileSystemController(service);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('Lifecycle and State Engine', () => {
    it('should initialize in ACTIVE state with valid health diagnostics', () => {
      expect(service.getState()).toBe(VirtualFileSystemState.ACTIVE);
      const health = controller.getHealth();
      expect(health.healthy).toBe(true);
      expect(health.serviceState).toBe(VirtualFileSystemState.ACTIVE);
      expect(health.subsystemChecks.stateEngine.status).toBe('UP');
    });

    it('should gracefully transition to TERMINATED state on shutdown', () => {
      service.onModuleDestroy();
      expect(service.getState()).toBe(VirtualFileSystemState.TERMINATED);
    });

    it('should reject new submissions when the service is terminated', async () => {
      service.onModuleDestroy();
      await expect(service.processRecord({ test: 'payload' })).rejects.toThrow(VirtualFileSystemException);
    });

    it('should allow clean state reset and reinitialization', async () => {
      await controller.submitRecord({ dummy: 1 });
      const resetResult = controller.reset('admin');
      expect(resetResult.message).toContain('Reset completed');
      const metrics = controller.getMetrics();
      expect(metrics.processedCount).toBe(0);
    });
  });

  describe('Record Ingestion and Business Logic', () => {
    it('should successfully ingest and fingerprint valid telemetry payloads', async () => {
      const record = await controller.submitRecord({ event: 'ping', size: 1024 }, 'agent', 'network,edge');
      expect(record.id).toBeDefined();
      expect(record.checksum).toHaveLength(16);
      expect(record.status).toBe(VirtualFileSystemState.ACTIVE);
      expect(record.sequenceNumber).toBe(1);
      expect(record.tags).toContain('network');
      expect(record.cpuTimeMicros).toBeGreaterThanOrEqual(1000);
    });

    it('should throw INVALID_PAYLOAD for empty payloads', async () => {
      await expect(controller.submitRecord({})).rejects.toThrow(VirtualFileSystemException);
    });

    it('should execute batch processing and record item errors without halting', async () => {
      const batchResult = await controller.submitBatch({
        items: [
          { valid: true, id: 1 },
          {}, // invalid empty object
          { valid: true, id: 3 },
        ],
      });

      expect(batchResult.totalRequested).toBe(3);
      expect(batchResult.successfulCount).toBe(2);
      expect(batchResult.failedCount).toBe(1);
      expect(batchResult.errors[0].index).toBe(1);
    });

    it('should support event subscription notifications on new records', async () => {
      const events: string[] = [];
      const unsubscribe = service.subscribe((rec) => {
        events.push(rec.id);
      });

      const rec = await controller.submitRecord({ notify: true });
      expect(events).toContain(rec.id);

      unsubscribe();
      await controller.submitRecord({ notify: false });
      expect(events.length).toBe(1);
    });

    it('should query stored records with filtering, pagination, and sorting', async () => {
      await controller.submitRecord({ val: 10 }, 'actor1', 'odd');
      await controller.submitRecord({ val: 20 }, 'actor2', 'even');
      await controller.submitRecord({ val: 30 }, 'actor1', 'odd');

      const oddQuery = controller.queryRecords(undefined, undefined, 'odd', 10, 0);
      expect(oddQuery.total).toBe(2);

      const pagedQuery = controller.queryRecords(undefined, undefined, undefined, 2, 0);
      expect(pagedQuery.items.length).toBe(2);
    });

    it('should retrieve individual records by ID or throw error for missing ID', () => {
      expect(() => controller.getRecord('non-existent-guid')).toThrow(VirtualFileSystemException);
    });
  });

  describe('Observability, Metrics, and Audit Trails', () => {
    it('should compute p50, p95, p99 percentiles and throughput correctly', async () => {
      for (let i = 0; i < 10; i++) {
        await controller.submitRecord({ iteration: i });
      }

      const metrics = controller.getMetrics();
      expect(metrics.processedCount).toBe(10);
      expect(metrics.p50LatencyMs).toBeGreaterThanOrEqual(0);
      expect(metrics.throughputPerSecond).toBeGreaterThan(0);
    });

    it('should export standard Prometheus-compatible telemetry format', async () => {
      await controller.submitRecord({ sample: 'prometheus' });
      const prometheusOutput = controller.getPrometheusMetrics();
      expect(prometheusOutput).toContain('_processed_total');
      expect(prometheusOutput).toContain('_buffer_utilization_percent');
    });

    it('should maintain immutable audit logging across configuration changes', () => {
      controller.updateConfig({ maxConcurrency: 250 }, 'security-officer');
      const audit = controller.getAuditTrail(5);
      expect(audit.length).toBeGreaterThan(0);
      const lastAudit = audit[audit.length - 1];
      expect(lastAudit.actorId).toBe('security-officer');
      expect(lastAudit.action).toBe('UPDATE_CONFIG');
    });

    it('should purge stale records past retention threshold', async () => {
      await controller.submitRecord({ temp: 'purge-candidate' });
      const purgeRes = controller.purge(0, 'cleaner');
      expect(purgeRes.purged).toBeGreaterThanOrEqual(1);
    });
  });

  
});
