import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SyncService } from '../sync/sync.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { VaultService } from '../security/vault.service';
import { randomBytes, scryptSync } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let blacklistService: TokenBlacklistService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const configMock = {
    get: jest.fn((key: string) => {
      if (key === 'REDIS_HOST') return 'localhost';
      if (key === 'REDIS_PORT') return '6379';
      return null;
    }),
  };

  const jwtMock = {
    sign: jest.fn().mockReturnValue('signed-jwt'),
    verify: jest.fn().mockReturnValue({ sub: 'user-id', email: 'dev@example.com', is2faPending: true }),
  };

  const syncMock = {
    syncUserData: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenBlacklistService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: ConfigService,
          useValue: configMock,
        },
        {
          provide: JwtService,
          useValue: jwtMock,
        },
        {
          provide: SyncService,
          useValue: syncMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    blacklistService = module.get<TokenBlacklistService>(TokenBlacklistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registers email accounts and returns an accessToken, refreshToken, and expiresIn', async () => {
    const user = {
      id: 'user-id',
      githubId: null,
      username: 'developer-123abc',
      name: 'Developer',
      email: 'dev@example.com',
      passwordHash: null,
    };
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(user);
    prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt-id' });

    const response = await service.register({
      name: 'Developer',
      email: 'DEV@example.com',
      password: 'secure-password',
      interests: ['Backend'],
    });

    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    expect(response.accessToken).toBe('signed-jwt');
    expect(response.refreshToken).toBeDefined();
    expect(response.expiresIn).toBe(900);
    expect(jwtMock.sign).toHaveBeenCalled();
    expect(prismaMock.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-id',
        }),
      }),
    );

    const salt = randomBytes(16).toString('hex');
    prismaMock.user.findUnique.mockResolvedValue({
      ...user,
      passwordHash: `${salt}:${scryptSync('secure-password', salt, 64).toString('hex')}`,
    });
    await expect(
      service.authenticateWithPassword('dev@example.com', 'secure-password'),
    ).resolves.toMatchObject({
      accessToken: 'signed-jwt',
      expiresIn: 900,
    });
    await expect(
      service.authenticateWithPassword('dev@example.com', 'wrong-password'),
    ).rejects.toThrow('Invalid email or password.');
  });

  it('rotates refresh token and issues a fresh pair for valid token', async () => {
    const rawRefreshToken = 'valid-refresh-token-1234567890abcdef1234567890';
    const user = {
      id: 'user-id-1',
      githubId: null,
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
    };
    const tokenRecord = {
      id: 'record-id-1',
      userId: user.id,
      familyId: 'family-123',
      tokenHash: blacklistService.hashToken(rawRefreshToken),
      deviceFingerprint: 'desktop-chrome',
      expiresAt: new Date(Date.now() + 100000),
      revokedAt: null,
      user,
    };

    prismaMock.refreshToken.findUnique.mockResolvedValue(tokenRecord);
    prismaMock.refreshToken.update.mockResolvedValue({
      ...tokenRecord,
      revokedAt: new Date(),
    });
    prismaMock.refreshToken.create.mockResolvedValue({ id: 'new-record-id' });

    const result = await service.refreshAccessToken(
      rawRefreshToken,
      'desktop-chrome',
    );

    expect(result.accessToken).toBe('signed-jwt');
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe(rawRefreshToken);
    expect(prismaMock.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'record-id-1' },
      }),
    );
    expect(prismaMock.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          familyId: 'family-123',
          userId: user.id,
        }),
      }),
    );
  });

  it('detects refresh token reuse and revokes the entire token family (replay attack defense)', async () => {
    const reusedToken = 'already-used-refresh-token-12345';
    const user = {
      id: 'user-id-1',
      githubId: null,
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
    };
    const alreadyRevokedRecord = {
      id: 'record-id-1',
      userId: user.id,
      familyId: 'compromised-family-456',
      tokenHash: blacklistService.hashToken(reusedToken),
      expiresAt: new Date(Date.now() + 100000),
      revokedAt: new Date(Date.now() - 5000), // Already revoked!
      user,
    };

    prismaMock.refreshToken.findUnique.mockResolvedValue(alreadyRevokedRecord);
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    await expect(service.refreshAccessToken(reusedToken)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { familyId: 'compromised-family-456' },
      }),
    );
    expect(
      await blacklistService.isFamilyBlacklisted('compromised-family-456'),
    ).toBe(true);
  });

  it('logs out and blacklists token family in Redis and database', async () => {
    const rawRefreshToken = 'logout-refresh-token-999';
    const tokenRecord = {
      id: 'record-id-999',
      userId: 'user-id-999',
      familyId: 'family-to-logout',
      tokenHash: blacklistService.hashToken(rawRefreshToken),
    };

    prismaMock.refreshToken.findUnique.mockResolvedValue(tokenRecord);
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const res = await service.logout(rawRefreshToken, 'sample-access-token');

    expect(res).toEqual({ message: 'Successfully logged out' });
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-to-logout' },
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    });
    expect(await blacklistService.isFamilyBlacklisted('family-to-logout')).toBe(
      true,
    );
    expect(
      await blacklistService.isTokenBlacklisted('sample-access-token'),
    ).toBe(true);
  });

  it('does not disclose or issue a reset for an unregistered email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.requestPasswordReset('unknown@example.com'),
    ).resolves.toBeUndefined();
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { authEmail: 'unknown@example.com' },
    });
  });

  it('signs tokens using Vault rotated secret when VaultService is provided', async () => {
    const vaultMock = {
      getCurrentJwtSigningKey: jest
        .fn()
        .mockReturnValue('vault-active-key-777'),
    };

    const moduleWithVault: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenBlacklistService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: ConfigService,
          useValue: configMock,
        },
        {
          provide: JwtService,
          useValue: jwtMock,
        },
        {
          provide: SyncService,
          useValue: syncMock,
        },
        {
          provide: VaultService,
          useValue: vaultMock,
        },
      ],
    }).compile();

    const authWithVault = moduleWithVault.get<AuthService>(AuthService);

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'vault-user-id',
      githubId: null,
      username: 'vaultuser',
      name: 'Vault User',
      email: 'vault@example.com',
      passwordHash: null,
    });
    prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt-id' });

    await authWithVault.register({
      name: 'Vault User',
      email: 'vault@example.com',
      password: 'password123',
    });

    expect(jwtMock.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'vault-user-id' }),
      { secret: 'vault-active-key-777' },
    );
  });

  describe('Two-Factor Authentication (TOTP / 2FA Engine #309)', () => {
    const salt = randomBytes(16).toString('hex');
    const key = scryptSync('Password123!', salt, 64);
    const validPasswordHash = `${salt}:${key.toString('hex')}`;

    it('returns temporary 2fa_pending token with 5-min expiry when twoFactorEnabled is true', async () => {
      const user = {
        id: '2fa-user-id',
        authEmail: '2fa@example.com',
        username: 'securedev',
        name: 'Secure Dev',
        email: '2fa@example.com',
        passwordHash: validPasswordHash,
        twoFactorEnabled: true,
        twoFactorSecret: 'enc-secret',
        twoFactorBackupCodes: [],
      };
      prismaMock.user.findUnique.mockResolvedValue(user);

      const response = await service.authenticateWithPassword(
        '2fa@example.com',
        'Password123!',
      );

      expect(response.is2faRequired).toBe(true);
      expect(response.twoFactorToken).toBeDefined();
      expect(response.expiresIn).toBe(300);
      expect(response.accessToken).toBeUndefined(); // Must NOT issue full access token yet
    });

    it('generates base32 secret, QR data URL, and encrypts secret at rest in DB', async () => {
      const user = {
        id: 'user-setup-2fa',
        authEmail: 'setup@example.com',
        username: 'setupdev',
        email: 'setup@example.com',
      };
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.user.update.mockResolvedValue(user);

      const res = await service.generateTwoFactorSecret('user-setup-2fa');

      expect(res.secret).toHaveLength(32);
      expect(res.otpauthUrl).toContain('otpauth://totp/CodePulse:setup%40example.com');
      expect(res.qrCodeDataUrl).toMatch(/^data:image\//);

      // Verify encrypted storage in Prisma
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-setup-2fa' },
          data: expect.objectContaining({
            twoFactorSecret: expect.stringMatching(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/),
          }),
        }),
      );
    });

    it('enables 2FA and returns 10 emergency backup recovery codes on valid 6-digit TOTP verification', async () => {
      // Use internal two-factor service to compute valid code
      const tfa = (service as any).tfaService;
      const plainSecret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
      const encryptedSecret = tfa.encryptSecret(plainSecret);
      const validCode = tfa.computeTotp(plainSecret);

      const user = {
        id: 'user-enable-2fa',
        twoFactorSecret: encryptedSecret,
        twoFactorEnabled: false,
      };
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.user.update.mockResolvedValue({ ...user, twoFactorEnabled: true });

      const res = await service.enableTwoFactor('user-enable-2fa', validCode);

      expect(res.enabled).toBe(true);
      expect(res.backupCodes).toHaveLength(10);
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-enable-2fa' },
          data: expect.objectContaining({
            twoFactorEnabled: true,
            twoFactorBackupCodes: expect.any(Array),
          }),
        }),
      );
    });

    it('allows login verification using single-use emergency backup recovery code and decrements codes in DB', async () => {
      const tfa = (service as any).tfaService;
      const plainSecret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
      const encryptedSecret = tfa.encryptSecret(plainSecret);
      const { codes, hashedCodes } = tfa.generateRecoveryCodes(10);
      const backupCodeToUse = codes[0];

      const user = {
        id: 'user-backup-redemption',
        authEmail: 'recovery@example.com',
        username: 'recoverydev',
        name: 'Recovery Dev',
        email: 'recovery@example.com',
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: hashedCodes,
      };

      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.user.update.mockResolvedValue(user);
      prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      jwtMock.verify.mockReturnValue({
        sub: 'user-backup-redemption',
        is2faPending: true,
      });

      const response = await service.verifyTwoFactorLogin({
        twoFactorToken: 'valid-2fa-pending-jwt',
        code: backupCodeToUse,
      });

      expect(response.accessToken).toBe('signed-jwt');
      // Verify the redeemed code was deleted from user's backup codes list
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-backup-redemption' },
          data: expect.objectContaining({
            twoFactorBackupCodes: expect.arrayContaining([]),
          }),
        }),
      );
    });
  });
});
