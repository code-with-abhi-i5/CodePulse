import { TemplateCompilerService } from './template-compiler.service';
import {
  NotificationBatchDispatcherService,
  NotificationItem,
} from './notification-batch-dispatcher.service';

describe('NotificationBatchDispatcherService (#1415)', () => {
  let compiler: TemplateCompilerService;
  let dispatcher: NotificationBatchDispatcherService;

  beforeEach(() => {
    compiler = new TemplateCompilerService();
    dispatcher = new NotificationBatchDispatcherService(compiler);
  });

  afterEach(() => {
    dispatcher.clear();
    compiler.clearCache();
  });

  describe('TemplateCompilerService', () => {
    it('should substitute dynamic variables with HTML escaping', () => {
      const template = 'Hello, {{name}}! Welcome to {{platform}}.';
      const result = compiler.render(template, { name: 'Alice & Bob', platform: 'CodePulse' });
      expect(result).toBe('Hello, Alice &amp; Bob! Welcome to CodePulse.');
    });

    it('should support raw unescaped values with triple curlies', () => {
      const template = 'Click <a href="{{{link}}}">here</a>';
      const result = compiler.render(template, { link: 'https://codepulse.io?q=1&v=2' });
      expect(result).toBe('Click <a href="https://codepulse.io?q=1&v=2">here</a>');
    });

    it('should process conditional blocks', () => {
      const template = 'Status: {{#if isWinner}}🏆 Winner!{{else}}Keep pushing!{{/if}}';
      expect(compiler.render(template, { isWinner: true })).toBe('Status: 🏆 Winner!');
      expect(compiler.render(template, { isWinner: false })).toBe('Status: Keep pushing!');
    });

    it('should process loop iterations', () => {
      const template = 'Badges: {{#each badges}}[{{this}}]{{/each}}';
      const result = compiler.render(template, { badges: ['BugHunter', 'Architect', 'FastCoder'] });
      expect(result).toBe('Badges: [BugHunter][Architect][FastCoder]');
    });
  });

  describe('NotificationBatchDispatcherService', () => {
    it('should dispatch a batch of notifications with dynamic template rendering', async () => {
      const items: NotificationItem[] = [
        {
          recipient: 'dev1@example.com',
          channel: 'EMAIL',
          template: 'Hello {{user}}, your challenge is ready!',
          context: { user: 'DevOne' },
        },
        {
          recipient: '#general',
          channel: 'SLACK',
          template: 'New commit by {{author}} in {{repo}}',
          context: { author: 'Dipak', repo: 'CodePulse' },
        },
      ];

      const results = await dispatcher.dispatchBatch(items);
      expect(results.length).toBe(2);
      expect(results[0].status).toBe('DELIVERED');
      expect(results[0].renderedContent).toBe('Hello DevOne, your challenge is ready!');
      expect(results[1].status).toBe('DELIVERED');
      expect(results[1].renderedContent).toBe('New commit by Dipak in CodePulse');

      const telemetry = dispatcher.getTelemetry();
      expect(telemetry.totalDispatched).toBe(2);
      expect(telemetry.totalDelivered).toBe(2);
    });

    it('should enforce idempotency keys and prevent duplicate deliveries', async () => {
      const item: NotificationItem = {
        idempotencyKey: 'idemp-tx-12345',
        recipient: 'alice@example.com',
        channel: 'EMAIL',
        template: 'Transaction confirmed: {{txId}}',
        context: { txId: 'tx-999' },
      };

      const firstPass = await dispatcher.dispatchBatch([item]);
      expect(firstPass[0].status).toBe('DELIVERED');

      // Duplicate delivery attempt
      const secondPass = await dispatcher.dispatchBatch([item]);
      expect(secondPass[0].status).toBe('DUPLICATE');
      expect(secondPass[0].error).toContain('idempotency key');

      const telemetry = dispatcher.getTelemetry();
      expect(telemetry.totalDuplicatesSkipped).toBe(1);
    });

    it('should track engagement events: open, click, and bounce', async () => {
      const results = await dispatcher.dispatchBatch([
        {
          recipient: 'bob@example.com',
          channel: 'EMAIL',
          template: 'Your weekly digest',
          context: {},
        },
      ]);

      const notifId = results[0].notificationId;

      // Track open
      expect(dispatcher.recordOpen(notifId)).toBe(true);
      // Track click
      expect(dispatcher.recordClick(notifId)).toBe(true);

      const telemetry = dispatcher.getTelemetry();
      expect(telemetry.totalOpened).toBe(1);
      expect(telemetry.totalClicked).toBe(1);

      // Track bounce
      expect(dispatcher.recordBounce(notifId, 'Mailbox full')).toBe(true);
      expect(dispatcher.getTelemetry().totalBounced).toBe(1);
    });

    it('should dispatch high volume (10,000 notifications) in under 15 seconds benchmark', async () => {
      const count = 10000;
      const notifications: NotificationItem[] = [];

      for (let i = 0; i < count; i++) {
        notifications.push({
          recipient: `device-token-${i}`,
          channel: 'PUSH',
          template: 'Level Up! You earned {{xp}} XP.',
          context: { xp: i * 10 },
          idempotencyKey: `bulk-key-${i}`,
        });
      }

      const start = Date.now();
      const results = await dispatcher.dispatchBatch(notifications, 1000);
      const elapsed = Date.now() - start;

      expect(results.length).toBe(count);
      // Verify benchmark SLA: < 15,000ms
      expect(elapsed).toBeLessThan(15000);

      const telemetry = dispatcher.getTelemetry();
      expect(telemetry.totalDelivered).toBe(count);
    });
  });
});
