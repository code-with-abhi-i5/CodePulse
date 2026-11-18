import axios from 'axios';
import {
  BadGatewayException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../prisma/prisma.service';
import { PrAnalyticsService } from './pr-analytics.service';
const pr = {
  number: 2,
  user: { login: 'author' },
  created_at: '2026-11-01T00:00:00Z',
  merged_at: null,
  review_comments: 0,
};
function setup() {
  const repository = {
    findFirst: jest
      .fn()
      .mockResolvedValue({
        id: 'r',
        fullName: 'owner/project',
        isPrivate: false,
      }),
    findMany: jest.fn().mockResolvedValue([]),
  };
  const metric = {
    upsert: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
  };
  const transaction = jest.fn(async (queries) => Promise.all(queries));
  const service = new PrAnalyticsService(
    {
      repository,
      pullRequestMetric: metric,
      $transaction: transaction,
    } as unknown as PrismaService,
    { get: jest.fn() } as unknown as ConfigService,
  );
  return { service, repository, metric, transaction };
}
const github = () =>
  jest
    .spyOn(axios, 'get')
    .mockResolvedValueOnce({ data: [{ number: 2 }], headers: {} })
    .mockResolvedValueOnce({ data: pr })
    .mockResolvedValueOnce({ data: [], headers: {} });
describe('persisted PR analytics pipeline', () => {
  afterEach(() => jest.restoreAllMocks());
  it('publishes snapshots through one transaction with an idempotent repository/PR key', async () => {
    github();
    const { service, metric, transaction } = setup();
    expect(await service.refresh('u', 'r')).toEqual({
      refreshed: 1,
      partial: false,
    });
    expect(metric.upsert.mock.calls[0][0]).toMatchObject({
      where: { repositoryId_prNumber: { repositoryId: 'r', prNumber: 2 } },
      create: { repositoryId: 'r', firstReviewedAt: null },
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });
  it('does not fetch foreign/private repositories', async () => {
    const get = jest.spyOn(axios, 'get');
    const { service, repository } = setup();
    repository.findFirst.mockResolvedValueOnce(null);
    await expect(service.refresh('other', 'r')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    repository.findFirst.mockResolvedValueOnce({ ...pr, isPrivate: true });
    await expect(service.refresh('u', 'r')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(get).not.toHaveBeenCalled();
  });
  it('does not publish a partial failed refresh when review fetching fails', async () => {
    jest
      .spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: [{ number: 2 }], headers: {} })
      .mockResolvedValueOnce({ data: pr })
      .mockRejectedValueOnce(new Error('GitHub unavailable'));
    const { service, metric, transaction } = setup();
    await expect(service.refresh('u', 'r')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(metric.upsert).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });
  it('marks paginated review evidence as sampled', async () => {
    jest
      .spyOn(axios, 'get')
      .mockResolvedValueOnce({ data: [{ number: 2 }], headers: {} })
      .mockResolvedValueOnce({ data: pr })
      .mockResolvedValueOnce({
        data: [],
        headers: { link: '<next>; rel="next"' },
      });
    const { service, metric } = setup();
    expect((await service.refresh('u', 'r')).partial).toBe(true);
    expect(metric.upsert.mock.calls[0][0].create.partial).toBe(true);
  });
  it('queries only the authenticated owner public-repository cohort and returns unknown without evidence', async () => {
    const { service, metric } = setup();
    const result = await service.report('u', new Date('2026-11-17T00:00:00Z'));
    expect(metric.findMany.mock.calls[0][0].where.repository).toEqual({
      userId: 'u',
      isPrivate: false,
      archivedAt: null,
    });
    expect(result.efficiencyScore).toBeNull();
    expect(result.cohortStart).toBe('2026-10-18T00:00:00.000Z');
  });
});
