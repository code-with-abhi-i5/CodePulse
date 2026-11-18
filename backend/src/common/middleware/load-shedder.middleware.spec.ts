import { Request, Response, NextFunction } from 'express';
import {
  LoadShedderMiddleware,
  TrafficPriorityTier,
} from './load-shedder.middleware';
import { SystemMetricsService } from '../services/system-metrics.service';

/* eslint-disable @typescript-eslint/unbound-method */

describe('LoadShedderMiddleware', () => {
  let middleware: LoadShedderMiddleware;
  let metricsService: SystemMetricsService;

  beforeEach(() => {
    metricsService = new SystemMetricsService();
    middleware = new LoadShedderMiddleware(metricsService);
  });

  afterEach(() => {
    metricsService.stopSampling();
  });

  const createMockReqRes = (
    url: string,
    headers: Record<string, string> = {},
  ) => {
    const req = {
      url,
      originalUrl: url,
      headers,
    } as unknown as Request;

    const resJson = jest.fn();
    const resStatus = jest.fn().mockReturnValue({ json: resJson });
    const resSetHeader = jest.fn();

    const res = {
      status: resStatus,
      setHeader: resSetHeader,
      json: resJson,
    } as unknown as Response;

    const next: NextFunction = jest.fn();

    return { req, res, next, resStatus, resJson, resSetHeader };
  };

  it('should classify traffic priority tiers correctly', () => {
    const wsReq = {
      url: '/battles/socket',
      headers: { upgrade: 'websocket' },
    } as Request;
    expect(middleware.classifyRequestPriority(wsReq)).toBe(
      TrafficPriorityTier.TIER_1_CRITICAL,
    );

    const authReq = { url: '/api/v1/auth/login', headers: {} } as Request;
    expect(middleware.classifyRequestPriority(authReq)).toBe(
      TrafficPriorityTier.TIER_2_HIGH,
    );

    const matchmakingReq = {
      url: '/api/v1/battles/matchmaking',
      headers: {},
    } as Request;
    expect(middleware.classifyRequestPriority(matchmakingReq)).toBe(
      TrafficPriorityTier.TIER_2_HIGH,
    );

    const profileReq = { url: '/api/v1/users/profile', headers: {} } as Request;
    expect(middleware.classifyRequestPriority(profileReq)).toBe(
      TrafficPriorityTier.TIER_3_MEDIUM,
    );

    const syncReq = { url: '/api/v1/sync/github', headers: {} } as Request;
    expect(middleware.classifyRequestPriority(syncReq)).toBe(
      TrafficPriorityTier.TIER_4_LOW,
    );

    const analyticsReq = {
      url: '/api/v1/analytics/overview',
      headers: {},
    } as Request;
    expect(middleware.classifyRequestPriority(analyticsReq)).toBe(
      TrafficPriorityTier.TIER_4_LOW,
    );
  });

  it('should admit all traffic under healthy system metrics (event loop lag < 100ms)', () => {
    metricsService.setSimulatedMetrics(25); // 25ms lag (Green)

    const { req, res, next } = createMockReqRes('/api/v1/sync/github');
    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();

    const stats = middleware.getStats();
    expect(stats.admittedRequests).toBe(1);
    expect(stats.shedRequests).toBe(0);
    expect(stats.currentSystemHealth).toBe('GREEN');
  });

  it('should shed Tier 4 requests with HTTP 503 and Retry-After: 30 when lag >= 100ms', () => {
    metricsService.setSimulatedMetrics(140); // 140ms lag (Yellow)

    // Tier 4 (Sync/Analytics): Should be shed
    const {
      req: lowReq,
      res: lowRes,
      next: lowNext,
      resStatus,
      resSetHeader,
      resJson,
    } = createMockReqRes('/api/v1/analytics/export');

    middleware.use(lowReq, lowRes, lowNext);

    expect(lowNext).not.toHaveBeenCalled();
    expect(resStatus).toHaveBeenCalledWith(503);
    expect(resSetHeader).toHaveBeenCalledWith('Retry-After', 30);
    expect(resJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 503,
        priorityTier: TrafficPriorityTier.TIER_4_LOW,
      }),
    );

    // Tier 3 (Profile): Should still be admitted
    const {
      req: medReq,
      res: medRes,
      next: medNext,
    } = createMockReqRes('/api/v1/profile/pratik');

    middleware.use(medReq, medRes, medNext);
    expect(medNext).toHaveBeenCalled();
  });

  it('should shed Tier 3 & Tier 4 requests when lag >= 250ms, while preserving Tier 1 & Tier 2', () => {
    metricsService.setSimulatedMetrics(300); // 300ms lag (Red)

    // Tier 3: Shed
    const {
      req: t3Req,
      res: t3Res,
      next: t3Next,
      resStatus: t3Status,
    } = createMockReqRes('/api/v1/leaderboard');
    middleware.use(t3Req, t3Res, t3Next);
    expect(t3Next).not.toHaveBeenCalled();
    expect(t3Status).toHaveBeenCalledWith(503);

    // Tier 4: Shed
    const {
      req: t4Req,
      res: t4Res,
      next: t4Next,
      resStatus: t4Status,
    } = createMockReqRes('/api/v1/sync/owner');
    middleware.use(t4Req, t4Res, t4Next);
    expect(t4Next).not.toHaveBeenCalled();
    expect(t4Status).toHaveBeenCalledWith(503);

    // Tier 2 (Auth/Matchmaking): Admitted
    const {
      req: t2Req,
      res: t2Res,
      next: t2Next,
    } = createMockReqRes('/api/v1/auth/login');
    middleware.use(t2Req, t2Res, t2Next);
    expect(t2Next).toHaveBeenCalled();

    // Tier 1 (Critical Battle WebSocket): NEVER shed
    const {
      req: t1Req,
      res: t1Res,
      next: t1Next,
    } = createMockReqRes('/battles/live/action', { upgrade: 'websocket' });
    middleware.use(t1Req, t1Res, t1Next);
    expect(t1Next).toHaveBeenCalled();

    const stats = middleware.getStats();
    expect(stats.currentSystemHealth).toBe('RED');
    expect(stats.shedByTier[TrafficPriorityTier.TIER_3_MEDIUM]).toBe(1);
    expect(stats.shedByTier[TrafficPriorityTier.TIER_4_LOW]).toBe(1);
    expect(stats.shedByTier[TrafficPriorityTier.TIER_1_CRITICAL]).toBe(0);
    expect(stats.shedByTier[TrafficPriorityTier.TIER_2_HIGH]).toBe(0);
  });

  it('should simulate graduated recovery as system metrics return to green', () => {
    // 1. Spike to 350ms (Red)
    metricsService.setSimulatedMetrics(350);
    const {
      req: spikeReq,
      res: spikeRes,
      next: spikeNext,
    } = createMockReqRes('/api/v1/profile/pratik');
    middleware.use(spikeReq, spikeRes, spikeNext);
    expect(spikeNext).not.toHaveBeenCalled();

    // 2. Recovery to 30ms (Green)
    metricsService.setSimulatedMetrics(30);
    const {
      req: recReq,
      res: recRes,
      next: recNext,
    } = createMockReqRes('/api/v1/profile/pratik');
    middleware.use(recReq, recRes, recNext);
    expect(recNext).toHaveBeenCalled();

    const stats = middleware.getStats();
    expect(stats.currentSystemHealth).toBe('GREEN');
  });
});
