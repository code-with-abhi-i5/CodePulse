import axios from 'axios';
import { BadGatewayException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import type { PrismaService } from '../../prisma/prisma.service';
import { RecommendationsService } from './recommendations.service';
const own = {
  id: 'repo',
  fullName: 'owner/project',
  commits: 20,
  repoUpdatedAt: new Date('2026-11-01T00:00:00Z'),
};
function setup() {
  const store = new Map();
  const user = { findUnique: jest.fn().mockResolvedValue({ id: 'u' }) };
  const repository = {
    findMany: jest.fn(async (args) =>
      args.where.userId === 'u'
        ? [own]
        : [
            { userId: 'peer', language: 'JavaScript', commits: 10 },
            { userId: 'peer', language: 'Go', commits: 10 },
          ],
    ),
  };
  const cache = {
    get: jest.fn(async (key: string) => store.get(key)),
    set: jest.fn(async (key: string, value: unknown, ttl?: number) => {
      store.set(key, value);
    }),
  };
  const service = new RecommendationsService(
    { user, repository } as unknown as PrismaService,
    { get: jest.fn() } as unknown as ConfigService,
    cache as unknown as Cache,
  );
  return { service, user, repository, cache };
}
describe('authenticated repository-evidence recommendations', () => {
  afterEach(() => jest.restoreAllMocks());
  it('uses GitHub language bytes, returns no peer identities, and caches for seven days', async () => {
    const get = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: { JavaScript: 900, Python: 100 } });
    const { service, cache, repository } = setup();
    const result = await service.getTechStack('u');
    expect(result.evidence.JavaScript).toBeCloseTo(0.9);
    expect(result.recommendations[0].technology).toBe('TypeScript');
    expect(JSON.stringify(result)).not.toContain('"peer"');
    await service.getTechStack('u');
    expect(get).toHaveBeenCalledTimes(1);
    expect(cache.set.mock.calls[0][2]).toBe(604800000);
    expect(repository.findMany.mock.calls[0][0].where).toMatchObject({
      userId: 'u',
      isPrivate: false,
      archivedAt: null,
    });
  });
  it('authorizes before a cache hit and rejects missing users', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({ data: { JavaScript: 100 } });
    const { service, user, cache } = setup();
    await service.getTechStack('u');
    user.findUnique.mockResolvedValueOnce(null);
    await expect(service.getTechStack('u')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(cache.get).toHaveBeenCalledTimes(1);
  });
  it('does not cache errors or invalid byte evidence', async () => {
    jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: { JavaScript: 'oops' } });
    const { service, cache } = setup();
    await expect(service.getTechStack('u')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(cache.set).not.toHaveBeenCalled();
  });
  it('returns an honest cold start when no repositories are available', async () => {
    const get = jest.spyOn(axios, 'get');
    const { service, repository } = setup();
    repository.findMany.mockResolvedValue([]);
    expect(await service.getTechStack('u')).toMatchObject({
      recommendations: [],
      sampledRepositories: 0,
      evidence: {},
    });
    expect(get).not.toHaveBeenCalled();
  });
  it('bounds language fetches and marks sampled repository histories', async () => {
    const get = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: { JavaScript: 100 } });
    const { service, repository } = setup();
    repository.findMany.mockImplementation(async (args) =>
      args.where.userId === 'u'
        ? Array.from({ length: 11 }, (_, i) => ({ ...own, id: String(i) }))
        : [],
    );
    expect(await service.getTechStack('u')).toMatchObject({
      partial: true,
      sampledRepositories: 10,
    });
    expect(get).toHaveBeenCalledTimes(10);
  });
  it('changes its cache key when repository evidence is updated', async () => {
    const get = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: { JavaScript: 100 } });
    const { service, repository } = setup();
    await service.getTechStack('u');
    repository.findMany.mockImplementation(async (args) =>
      args.where.userId === 'u'
        ? [{ ...own, commits: 21, repoUpdatedAt: new Date('2026-11-02') }]
        : [],
    );
    await service.getTechStack('u');
    expect(get).toHaveBeenCalledTimes(2);
  });
});
