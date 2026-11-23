import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthResponseDto, RegisterDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SyncService } from '../sync/sync.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { VaultService } from '../security/vault.service';
import { KmsEncryptionService } from '../security/kms-encryption.service';
import { TwoFactorService } from './two-factor.service';
import { BruteForceService } from './brute-force.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';
import * as nodemailer from 'nodemailer';

const scrypt = promisify(scryptCallback);

interface GitHubAccessTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserProfile {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string;
  bio?: string | null;
  location?: string | null;
  company?: string | null;
  blog?: string | null;
  html_url?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly syncService: SyncService,
    private readonly blacklistService: TokenBlacklistService,
    @Optional() private readonly vaultService?: VaultService,
    @Optional() private readonly twoFactorService?: TwoFactorService,
    @Optional() private readonly bruteForceService?: BruteForceService,
    @Optional() private readonly kmsEncryptionService?: KmsEncryptionService,
  ) {
    this.tfaService = this.twoFactorService || new TwoFactorService();
  }

  private readonly tfaService: TwoFactorService;

  async register(
    data: RegisterDto,
    deviceFingerprint?: string,
  ): Promise<AuthResponseDto> {
    const email = data.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { authEmail: email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const usernameBase =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 24) || 'developer';
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          authEmail: email,
          name: data.name.trim(),
          username: `${usernameBase}-${randomBytes(3).toString('hex')}`,
          passwordHash: await this.hashPassword(data.password),
          interests: data.interests ?? [],
        },
      });
      return await this.createAuthResponse(user, deviceFingerprint);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }
      throw error;
    }
  }

  async authenticateWithPassword(
    rawEmail: string,
    password: string,
    deviceFingerprint?: string,
    clientIp?: string,
  ): Promise<AuthResponseDto> {
    const email = rawEmail.trim().toLowerCase();

    // Check account lockout status across user and IP dimensions
    if (this.bruteForceService) {
      const lockout = await this.bruteForceService.getLockout(email, clientIp);
      if (lockout.isLocked) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: lockout.requiresEmailUnlock
              ? 'Account is locked due to 10+ failed login attempts. Email unlock required.'
              : `Account is temporarily locked due to excessive failed login attempts. Please try again in ${lockout.retryAfterSeconds} seconds.`,
            retryAfterSeconds: lockout.retryAfterSeconds,
            requiresEmailUnlock: lockout.requiresEmailUnlock,
            attemptCount: lockout.attemptCount,
            lockoutTier: lockout.lockoutTier,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { authEmail: email },
    });
    if (
      !user?.passwordHash ||
      !(await this.verifyPassword(password, user.passwordHash))
    ) {
      if (this.bruteForceService) {
        await this.bruteForceService.recordFailedAttempt(user?.username || email, clientIp);
      }
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Reset failure counter on successful credentials verification
    if (this.bruteForceService) {
      await this.bruteForceService.recordSuccessfulLogin(user.username || email, clientIp);
    }

    // Two-Factor Authentication Check:
    // If 2FA is activated on the user account, issue a temporary 5-minute 2fa_pending token
    // instead of the full access & refresh tokens.
    if (user.twoFactorEnabled) {
      const twoFactorToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.authEmail,
          is2faPending: true,
        },
        { expiresIn: '5m' },
      );

      return {
        is2faRequired: true,
        twoFactorToken,
        expiresIn: 300,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
        },
      };
    }

    return await this.createAuthResponse(user, deviceFingerprint);
  }

  async requestPasswordReset(rawEmail: string): Promise<void> {
    const email = rawEmail.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { authEmail: email },
    });
    if (!user?.authEmail) {
      return;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });
      await transaction.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });
    });

    try {
      await this.sendPasswordResetEmail(user.authEmail, token);
    } catch (error) {
      await this.prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
      this.logger.error(
        'Failed to send password-reset email',
        error instanceof Error ? error.message : String(error),
      );
      throw new ServiceUnavailableException(
        'Password reset is temporarily unavailable. Please try again later.',
      );
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = this.hashResetToken(token);
    const now = new Date();
    const passwordHash = await this.hashPassword(password);

    await this.prisma.$transaction(async (transaction) => {
      const reset = await transaction.passwordResetToken.findUnique({
        where: { tokenHash },
      });
      if (!reset || reset.usedAt || reset.expiresAt <= now) {
        throw new BadRequestException(
          'This password-reset link is invalid or expired.',
        );
      }

      const claimed = await transaction.passwordResetToken.updateMany({
        where: {
          id: reset.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException(
          'This password-reset link is invalid or expired.',
        );
      }

      await transaction.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      });
      await transaction.passwordResetToken.updateMany({
        where: { userId: reset.userId, id: { not: reset.id }, usedAt: null },
        data: { usedAt: now },
      });
    });
  }

  async refreshAccessToken(
    refreshToken: string,
    deviceFingerprint?: string,
  ): Promise<AuthResponseDto> {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.blacklistService.hashToken(refreshToken);

    // 1. Check if token itself is blacklisted
    const isTokenBlacklisted =
      await this.blacklistService.isTokenBlacklisted(refreshToken);
    if (isTokenBlacklisted) {
      const existing = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      if (existing) {
        // Token reuse or replay detected: revoke entire family immediately
        await this.prisma.refreshToken.updateMany({
          where: { familyId: existing.familyId },
          data: { revokedAt: new Date() },
        });
        await this.blacklistService.blacklistFamily(existing.familyId);
      }
      throw new UnauthorizedException(
        'Revoked refresh token reuse detected. Session terminated.',
      );
    }

    // 2. Query token record from database
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 3. Check if token family is blacklisted
    const isFamilyBlacklisted = await this.blacklistService.isFamilyBlacklisted(
      tokenRecord.familyId,
    );
    if (isFamilyBlacklisted) {
      throw new UnauthorizedException('Refresh token family has been revoked.');
    }

    // 4. Check for token reuse (already revoked token attempted to be used again)
    if (tokenRecord.revokedAt !== null) {
      // Replay attack detected: revoke entire token family immediately
      await this.prisma.refreshToken.updateMany({
        where: { familyId: tokenRecord.familyId },
        data: { revokedAt: new Date() },
      });
      await this.blacklistService.blacklistFamily(tokenRecord.familyId);
      await this.blacklistService.blacklistToken(refreshToken);
      throw new UnauthorizedException(
        'Token reuse detected. All sessions in this family have been revoked.',
      );
    }

    // 5. Check if token is expired
    if (tokenRecord.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // 6. Token Rotation: Immediately invalidate old refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });
    await this.blacklistService.blacklistToken(refreshToken);

    // 7. Issue fresh pair with sliding expiry preserving the familyId
    return await this.createAuthResponse(
      tokenRecord.user,
      deviceFingerprint || tokenRecord.deviceFingerprint || undefined,
      tokenRecord.familyId,
    );
  }

  async logout(
    refreshToken?: string,
    accessToken?: string,
  ): Promise<{ message: string }> {
    if (refreshToken && typeof refreshToken === 'string') {
      const tokenHash = this.blacklistService.hashToken(refreshToken);
      const record = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (record) {
        // Revoke token family in DB and blacklist in Redis
        await this.prisma.refreshToken.updateMany({
          where: { familyId: record.familyId },
          data: { revokedAt: new Date() },
        });
        await this.blacklistService.blacklistFamily(record.familyId);
      }
      await this.blacklistService.blacklistToken(refreshToken);
    }

    if (accessToken && typeof accessToken === 'string') {
      await this.blacklistService.blacklistToken(accessToken, 900);
    }

    return { message: 'Successfully logged out' };
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.blacklistService.isTokenBlacklisted(token);
  }

  private async createAuthResponse(
    user: {
      id: string;
      githubId: string | null;
      username: string;
      name: string | null;
      email: string | null;
    },
    deviceFingerprint?: string,
    existingFamilyId?: string,
  ): Promise<AuthResponseDto> {
    const signSecret = this.vaultService
      ? this.vaultService.getCurrentJwtSigningKey()
      : undefined;

    const accessToken = signSecret
      ? this.jwtService.sign(
          {
            sub: user.id,
            githubId: user.githubId,
            username: user.username,
            email: user.email,
          },
          { secret: signSecret },
        )
      : this.jwtService.sign({
          sub: user.id,
          githubId: user.githubId,
          username: user.username,
          email: user.email,
        });

    const refreshToken = randomBytes(40).toString('hex');
    const tokenHash = this.blacklistService.hashToken(refreshToken);
    const familyId = existingFamilyId || randomBytes(16).toString('hex');

    // 7 days sliding expiry
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    try {
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          familyId,
          deviceFingerprint: deviceFingerprint || null,
          expiresAt,
        },
      });
    } catch (error) {
      this.logger.error(
        'Failed to persist refresh token to database',
        error instanceof Error ? error.message : String(error),
      );
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const key = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${key.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
    const [salt, keyHex] = storedHash.split(':');
    if (!salt || !keyHex) {
      return false;
    }
    const expected = Buffer.from(keyHex, 'hex');
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async sendPasswordResetEmail(
    email: string,
    token: string,
  ): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST');
    const from = this.configService.get<string>('MAIL_FROM');
    if (!host || !from) {
      throw new Error('SMTP_HOST and MAIL_FROM must be configured.');
    }

    const port = Number(this.configService.get<string>('SMTP_PORT') || '1025');
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const appUrl = (
      this.configService.get<string>('APP_URL') || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user && password ? { auth: { user, pass: password } } : {}),
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Reset your CodePulse password',
      text: `Use this link within 30 minutes to reset your password: ${resetUrl}`,
      html: `<p>We received a request to reset your CodePulse password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.</p>`,
    });
  }

  async authenticateWithGitHub(
    code: string,
    deviceFingerprint?: string,
  ): Promise<AuthResponseDto> {
    try {
      if (!code) {
        throw new UnauthorizedException('Invalid GitHub code');
      }

      const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'GITHUB_CLIENT_SECRET',
      );
      if (!clientId || !clientSecret) {
        throw new ServiceUnavailableException(
          'GitHub sign-in is not configured.',
        );
      }

      // 1. Exchange 'code' for an access token
      const tokenResponse = await axios.post<GitHubAccessTokenResponse>(
        'https://github.com/login/oauth/access_token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        this.logger.error('Failed to get access token from GitHub');
        throw new UnauthorizedException(
          'Failed to get access token from GitHub',
        );
      }

      // 2. Fetch the user's GitHub profile
      const userResponse = await axios.get<GitHubUserProfile>(
        'https://api.github.com/user',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const githubUser = userResponse.data;
      if (!githubUser.id || !githubUser.login) {
        throw new UnauthorizedException('Failed to fetch GitHub user profile');
      }

      // 3. Find or create the user in the database
      const githubIdString = String(githubUser.id);

      // Envelope-encrypt GitHub OAuth access token with KMS
      let encryptedGithubToken: string | undefined;
      if (this.kmsEncryptionService) {
        encryptedGithubToken = this.kmsEncryptionService.encryptToken(accessToken);
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { githubId: githubIdString },
        select: { settings: true },
      });
      const existingSettings = (existingUser?.settings as Record<string, any>) || {};
      const updatedSettings = encryptedGithubToken
        ? { ...existingSettings, encryptedGithubToken }
        : existingSettings;

      const user = await this.prisma.user.upsert({
        where: { githubId: githubIdString },
        update: {
          name: githubUser.name || null,
          email: githubUser.email || null,
          avatar: githubUser.avatar_url || null,
          bio: githubUser.bio || null,
          location: githubUser.location || null,
          company: githubUser.company || null,
          website: githubUser.blog || null,
          githubUrl: githubUser.html_url || null,
          isOnline: true,
          settings: updatedSettings,
        },
        create: {
          githubId: githubIdString,
          username: githubUser.login,
          name: githubUser.name || null,
          email: githubUser.email || null,
          avatar: githubUser.avatar_url || null,
          bio: githubUser.bio || null,
          location: githubUser.location || null,
          company: githubUser.company || null,
          website: githubUser.blog || null,
          githubUrl: githubUser.html_url || null,
          isOnline: true,
          settings: updatedSettings,
        },
      });

      // 4. Trigger background sync without awaiting
      this.syncService
        .syncUserData(user.id, user.username, accessToken)
        .catch((error: unknown) =>
          this.logger.error(
            `Background sync failed for ${user.username}`,
            error instanceof Error ? error.message : String(error),
          ),
        );

      // 5. Return JWT with rotating refresh token
      return await this.createAuthResponse(user, deviceFingerprint);
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(
        'Failed to authenticate with GitHub',
        error instanceof Error ? error.message : String(error),
      );
      throw new UnauthorizedException('Failed to authenticate with GitHub');
    }
  }

  /**
   * Generates a new RFC 6238 TOTP base32 secret and QR code data URL for a user,
   * encrypts the secret at rest with AES-256-GCM, and updates the user record.
   */
  async generateTwoFactorSecret(userId: string): Promise<{
    secret: string;
    otpauthUrl: string;
    qrCodeDataUrl: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const accountIdentifier = user.authEmail || user.email || user.username;
    const { secret, otpauthUrl, qrCodeDataUrl } =
      await this.tfaService.generateSecret(accountIdentifier, 'CodePulse');

    const encryptedSecret = this.tfaService.encryptSecret(secret);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: encryptedSecret,
      },
    });

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl,
    };
  }

  /**
   * Verifies the 6-digit TOTP code and activates 2FA for the account.
   * Generates 10 single-use emergency backup recovery codes and returns them to the user.
   */
  async enableTwoFactor(
    userId: string,
    code: string,
  ): Promise<{
    enabled: boolean;
    backupCodes: string[];
    message: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA secret has not been generated for this account.');
    }

    const plainSecret = this.tfaService.decryptSecret(user.twoFactorSecret);
    const isValid = this.tfaService.verifyTotp(plainSecret, code);

    if (!isValid) {
      throw new BadRequestException('Invalid 6-digit TOTP verification code.');
    }

    // Generate 10 cryptographically random emergency recovery backup codes
    const { codes, hashedCodes } = this.tfaService.generateRecoveryCodes(10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: hashedCodes,
      },
    });

    return {
      enabled: true,
      backupCodes: codes,
      message: 'Two-factor authentication has been successfully activated.',
    };
  }

  /**
   * Verifies 2FA during login using either 6-digit TOTP or an 8-character emergency backup code.
   * On success, redeems backup code if used and issues full JWT access & refresh tokens.
   */
  async verifyTwoFactorLogin(data: {
    twoFactorToken?: string;
    email?: string;
    code: string;
    deviceFingerprint?: string;
  }): Promise<AuthResponseDto> {
    let userId: string | null = null;

    if (data.twoFactorToken) {
      try {
        const payload: any = this.jwtService.verify(data.twoFactorToken);
        if (!payload || !payload.sub || !payload.is2faPending) {
          throw new UnauthorizedException('Invalid or expired 2FA verification token.');
        }
        userId = payload.sub;
      } catch {
        throw new UnauthorizedException('Invalid or expired 2FA verification token.');
      }
    } else if (data.email) {
      const user = await this.prisma.user.findUnique({
        where: { authEmail: data.email.trim().toLowerCase() },
      });
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      throw new BadRequestException('Either a valid twoFactorToken or user email must be provided.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('Two-factor authentication is not enabled for this account.');
    }

    const cleanCode = data.code ? data.code.trim() : '';
    let isVerified = false;

    // 1. Try 6-digit TOTP code
    if (/^\d{6}$/.test(cleanCode)) {
      const plainSecret = this.tfaService.decryptSecret(user.twoFactorSecret);
      isVerified = this.tfaService.verifyTotp(plainSecret, cleanCode);
    }

    // 2. If not verified via TOTP, check if it is a single-use emergency recovery backup code
    if (!isVerified && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      const redemption = this.tfaService.verifyAndRedeemRecoveryCode(
        cleanCode,
        user.twoFactorBackupCodes,
      );

      if (redemption.valid) {
        isVerified = true;
        // Atomically update user to remove the redeemed backup code
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorBackupCodes: redemption.remainingHashedCodes,
          },
        });
        this.logger.log(`Emergency backup code successfully redeemed for user ${user.id}`);
      }
    }

    if (!isVerified) {
      throw new UnauthorizedException('Invalid two-factor authentication code or backup recovery code.');
    }

    return await this.createAuthResponse(user, data.deviceFingerprint);
  }

  /**
   * Disables 2FA on the user's account after verifying valid TOTP or recovery code.
   */
  async disableTwoFactor(
    userId: string,
    code: string,
  ): Promise<{ disabled: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled) {
      return { disabled: true, message: '2FA is already disabled.' };
    }

    const cleanCode = code ? code.trim() : '';
    let isVerified = false;

    if (user.twoFactorSecret && /^\d{6}$/.test(cleanCode)) {
      const plainSecret = this.tfaService.decryptSecret(user.twoFactorSecret);
      isVerified = this.tfaService.verifyTotp(plainSecret, cleanCode);
    }

    if (!isVerified && user.twoFactorBackupCodes) {
      const redemption = this.tfaService.verifyAndRedeemRecoveryCode(
        cleanCode,
        user.twoFactorBackupCodes,
      );
      if (redemption.valid) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      throw new BadRequestException('Invalid two-factor code or recovery code.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    return { disabled: true, message: 'Two-factor authentication has been disabled.' };
  }

  // --- KMS Envelope Encryption Architecture (#391) ---

  /**
   * Encrypts a GitHub access token using AES-256-GCM Envelope Encryption.
   */
  public encryptGithubToken(token: string, keyId?: string): string {
    if (!this.kmsEncryptionService) {
      return token;
    }
    return this.kmsEncryptionService.encryptToken(token, keyId);
  }

  /**
   * Decrypts an envelope-encrypted GitHub access token.
   */
  public decryptGithubToken(encryptedToken: string): string {
    if (!this.kmsEncryptionService) {
      return encryptedToken;
    }
    return this.kmsEncryptionService.decryptToken(encryptedToken);
  }

  /**
   * Re-encrypts an existing encrypted token under a new Master KMS Key.
   */
  public reencryptGithubToken(encryptedToken: string, targetKeyId?: string): string {
    if (!this.kmsEncryptionService) {
      return encryptedToken;
    }
    return this.kmsEncryptionService.reencryptToken(encryptedToken, targetKeyId);
  }
}
