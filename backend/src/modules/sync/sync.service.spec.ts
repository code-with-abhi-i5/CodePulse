import { SyncService } from './sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GithubService } from '../github/github.service';

function fixture() {
  let state: any = { repos: [], activities: [], stats: {}, serial: 0 };
  const tx: any = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    developerStats: {
      upsert: jest.fn(async (args: any) => {
        state.stats[args.where.userId] = args.update;
      }),
    },
    user: { update: jest.fn() },
    languageStat: { upsert: jest.fn() },
    developerRating: {
      findUnique: jest.fn().mockResolvedValue({ gamificationXp: 0, overall: 0 }),
      upsert: jest.fn(),
    },
    repository: {
      upsert: jest.fn(async ({ where, create, update }: any) => {
        const key = where.userId_githubRepoId;
        let row = state.repos.find(
          (r: any) =>
            r.userId === key.userId && r.githubRepoId === key.githubRepoId,
        );
        if (row) Object.assign(row, update);
        else {
          row = { id: `repo-${++state.serial}`, ...create };
          state.repos.push(row);
        }
        return row;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        state.repos
          .filter(
            (r: any) =>
              r.userId === where.userId &&
              !where.githubRepoId.notIn.includes(r.githubRepoId) &&
              r.archivedAt === null,
          )
          .forEach((r: any) => Object.assign(r, data));
      }),
    },
    activity: {
      findUnique: jest.fn(
        async ({ where }: any) =>
          state.activities.find(
            (r: any) =>
              r.userId === where.userId_githubEventId.userId &&
              r.githubEventId === where.userId_githubEventId.githubEventId,
          ) || null,
      ),
      findFirst: jest.fn(
        async ({ where }: any) =>
          state.activities.find(
            (r: any) =>
              r.userId === where.userId &&
              !r.githubEventId &&
              r.type === where.type &&
              r.repository === where.repository &&
              +r.createdAt === +where.createdAt,
          ) || null,
      ),
      update: jest.fn(async ({ where, data }: any) =>
        Object.assign(
          state.activities.find((r: any) => r.id === where.id),
          data,
        ),
      ),
      create: jest.fn(async ({ data }: any) => {
        state.activities.push({ id: `act-${++state.serial}`, ...data });
      }),
    },
  };
  const prisma: any = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (callback: any) => {
      const before = structuredClone(state);
      try {
        return await callback(tx);
      } catch (error) {
        state = before;
        throw error;
      }
    }),
  };
  const data: any = {
    repositories: {
      nodes: [
        {
          id: 'github-repo',
          name: 'demo',
          nameWithOwner: 'owner/demo',
          createdAt: '2026-01-01T00:00:00Z',
          stargazerCount: 4,
        },
      ],
      pageInfo: { hasNextPage: false },
    },
  };
  const events: any[] = [
    {
      id: 'event-1',
      type: 'PushEvent',
      repo: { name: 'owner/demo' },
      created_at: '2026-11-01T00:00:00Z',
      payload: { commits: [{}] },
    },
  ];
  const github: any = {
    fetchUserData: jest.fn(async () => data),
    fetchUserEvents: jest.fn(async () => events),
    fetchPushCommitMessages: jest.fn(async () => []),
  };
  return {
    service: new SyncService(prisma as PrismaService, github as GithubService),
    prisma,
    github,
    tx,
    data,
    events,
    state: () => state,
  };
}

describe('differential GitHub sync', () => {
  it('stores real push messages and preserves local metadata on later syncs', async () => {
    const f = fixture();
    f.events[0].payload.commits = [{ message: 'Fix login\n\nBody' }, { message: 'Add regression test' }];
    await f.service.syncUserData('u1', 'owner', 'token');
    expect(f.state().activities[0].metadata).toEqual({
      commitMessages: ['Fix login\n\nBody', 'Add regression test'],
    });
    f.state().activities[0].metadata.bookmark = true;
    f.events[0].payload.commits = [{ message: 'Fix login' }];
    await f.service.syncUserData('u1', 'owner', 'token');
    expect(f.state().activities[0].metadata).toEqual({
      bookmark: true,
      commitMessages: ['Fix login'],
    });
  });

  it('enriches a current PushEvent that omits commits from the Events API', async () => {
    const f = fixture();
    f.events[0].created_at = new Date().toISOString();
    f.events[0].payload = {
      before: 'a'.repeat(40),
      head: 'b'.repeat(40),
    };
    f.github.fetchPushCommitMessages.mockResolvedValue(['Fix retry handling']);
    await f.service.syncUserData('u1', 'owner', 'token');
    expect(f.github.fetchPushCommitMessages).toHaveBeenCalledWith(
      'owner/demo', 'a'.repeat(40), 'b'.repeat(40), 'token',
    );
    expect(f.state().activities[0].metadata).toEqual({ commitMessages: ['Fix retry handling'] });
  });

  it('repeated sync updates GitHub stats while preserving IDs, local metadata and old activities', async () => {
    const f = fixture();
    await f.service.syncUserData('u1', 'owner', 'test-token');
    const repo = f.state().repos[0];
    repo.pinned = true;
    const id = repo.id;
    f.state().activities[0].metadata = { bookmark: true };
    f.state().activities.push({
      id: 'historical',
      userId: 'u1',
      title: 'Old contribution',
    });
    f.data.repositories.nodes[0].stargazerCount = 19;
    await f.service.syncUserData('u1', 'owner', 'test-token');
    expect(f.state().repos).toHaveLength(1);
    expect(repo.id).toBe(id);
    expect(repo.pinned).toBe(true);
    expect(repo.stars).toBe(19);
    expect(f.state().activities).toHaveLength(2);
    expect(f.state().activities[0].metadata).toEqual({ bookmark: true });
    expect(f.github.fetchUserEvents).toHaveBeenCalledWith(
      'owner',
      'test-token',
      100,
      true,
      true,
    );
    expect(f.tx.$queryRaw).toHaveBeenCalledTimes(2);
  });
  it('the same GitHub repo/event can belong to different users', async () => {
    const f = fixture();
    await f.service.syncUserData('u1', 'owner', 'token');
    await f.service.syncUserData('u2', 'owner', 'token');
    expect(f.state().repos).toHaveLength(2);
    expect(f.state().activities).toHaveLength(2);
  });
  it('adopts an exact legacy activity without deleting its metadata or identity', async () => {
    const f = fixture();
    f.state().activities.push({
      id: 'legacy',
      userId: 'u1',
      type: 'COMMIT',
      repository: 'owner/demo',
      createdAt: new Date(f.events[0].created_at),
      metadata: { saved: true },
    });
    await f.service.syncUserData('u1', 'owner', 'token');
    expect(f.state().activities).toHaveLength(1);
    expect(f.state().activities[0]).toMatchObject({
      id: 'legacy',
      githubEventId: 'github:event-1',
      metadata: { saved: true },
    });
  });
  it('only a confirmed complete repo page archives missing records and reappearance restores them', async () => {
    const f = fixture();
    await f.service.syncUserData('u1', 'owner', 'token');
    const node = f.data.repositories.nodes[0];
    f.data.repositories.nodes = [];
    f.data.repositories.pageInfo.hasNextPage = true;
    await f.service.syncUserData('u1', 'owner', 'token');
    expect(f.state().repos[0].archivedAt).toBeNull();
    delete f.data.repositories.pageInfo;
    await f.service.syncUserData('u1', 'owner', 'token');
    expect(f.state().repos[0].archivedAt).toBeNull();
    f.data.repositories.pageInfo = { hasNextPage: false };
    await f.service.syncUserData('u1', 'owner', 'token');
    expect(f.state().repos[0].archivedAt).toBeInstanceOf(Date);
    f.data.repositories.nodes = [node];
    await f.service.syncUserData('u1', 'owner', 'token');
    expect(f.state().repos[0].archivedAt).toBeNull();
  });
  it('remote event failure opens no write transaction', async () => {
    const f = fixture();
    f.github.fetchUserEvents.mockRejectedValueOnce(
      new Error('network failure'),
    );
    await expect(
      f.service.syncUserData('u1', 'owner', 'token'),
    ).rejects.toThrow('network failure');
    expect(f.prisma.$transaction).not.toHaveBeenCalled();
  });
  it('late repository failure rolls back earlier stats and timeline writes and is propagated', async () => {
    const f = fixture();
    f.tx.repository.upsert.mockRejectedValueOnce(new Error('database failure'));
    await expect(
      f.service.syncUserData('u1', 'owner', 'token'),
    ).rejects.toThrow('database failure');
    expect(f.state()).toMatchObject({ repos: [], activities: [], stats: {} });
  });
  it('missing external event IDs use a repeatable composite key', async () => {
    const f = fixture();
    delete f.events[0].id;
    await f.service.syncUserData('u1', 'owner', 'token');
    await f.service.syncUserData('u1', 'owner', 'token');
    expect(f.state().activities).toHaveLength(1);
    expect(f.state().activities[0].githubEventId).toMatch(/^fallback:/);
  });
  it('invalid repository identities and incomplete responses fail without committed changes', async () => {
    const f = fixture();
    delete f.data.repositories.nodes[0].id;
    await expect(
      f.service.syncUserData('u1', 'owner', 'token'),
    ).rejects.toThrow('identity');
    expect(f.state().activities).toHaveLength(0);
    delete f.data.repositories.nodes;
    await expect(
      f.service.syncUserData('u1', 'owner', 'token'),
    ).rejects.toThrow('Incomplete');
  });

  describe('Envelope Encryption Architecture with KMS (#391)', () => {
    it('decrypts stored envelope token and passes plaintext token to syncUserData', async () => {
      const f = fixture();
      const mockKms = {
        isEnvelope: jest.fn().mockReturnValue(true),
        decryptToken: jest.fn().mockReturnValue('gho_decrypted_kms_secret_token_123'),
        encryptToken: jest.fn().mockReturnValue('enc:v1:mock_encrypted_envelope_payload'),
        reencryptToken: jest.fn().mockReturnValue('enc:v1:mock_rotated_envelope_payload'),
      };

      const syncWithKms = new SyncService(f.prisma, f.github, mockKms as any);
      f.prisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-kms-1',
        username: 'kms-developer',
        settings: {
          encryptedGithubToken: 'enc:v1:mock_encrypted_envelope_payload',
        },
      });

      const syncUserDataSpy = jest.spyOn(syncWithKms, 'syncUserData').mockResolvedValueOnce(undefined as any);

      await syncWithKms.syncUser('u-kms-1');

      expect(mockKms.decryptToken).toHaveBeenCalledWith('enc:v1:mock_encrypted_envelope_payload');
      expect(syncUserDataSpy).toHaveBeenCalledWith('u-kms-1', 'kms-developer', 'gho_decrypted_kms_secret_token_123');
    });

    it('stores user encrypted GitHub token with fresh KMS DEK', async () => {
      const f = fixture();
      const mockKms = {
        encryptToken: jest.fn().mockReturnValue('enc:v1:encrypted_token_stored'),
      };
      const syncWithKms = new SyncService(f.prisma, f.github, mockKms as any);

      f.prisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-store-1',
        settings: { theme: 'dark' },
      });

      const encrypted = await syncWithKms.storeUserEncryptedGithubToken('u-store-1', 'ghp_raw_secret_token');
      expect(encrypted).toBe('enc:v1:encrypted_token_stored');
      expect(mockKms.encryptToken).toHaveBeenCalledWith('ghp_raw_secret_token');
      expect(f.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-store-1' },
          data: expect.objectContaining({
            settings: {
              theme: 'dark',
              encryptedGithubToken: 'enc:v1:encrypted_token_stored',
            },
          }),
        })
      );
    });

    it('rotates user stored DEK under new Master KMS Key without changing data ciphertext', async () => {
      const f = fixture();
      const mockKms = {
        isEnvelope: jest.fn().mockReturnValue(true),
        reencryptToken: jest.fn().mockReturnValue('enc:v1:rotated_dek_token_2027'),
      };
      const syncWithKms = new SyncService(f.prisma, f.github, mockKms as any);

      f.prisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-rot-1',
        settings: {
          encryptedGithubToken: 'enc:v1:old_dek_token_2026',
        },
      });

      const rotated = await syncWithKms.rotateUserGithubTokenKey('u-rot-1', 'new-kms-key-2027');
      expect(rotated).toBe(true);
      expect(mockKms.reencryptToken).toHaveBeenCalledWith('enc:v1:old_dek_token_2026', 'new-kms-key-2027');
      expect(f.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-rot-1' },
          data: expect.objectContaining({
            settings: {
              encryptedGithubToken: 'enc:v1:rotated_dek_token_2027',
            },
          }),
        })
      );
    });
  });
});
