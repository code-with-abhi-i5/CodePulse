import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';

export class GitHubLoginDto {
  @ApiProperty({
    description: 'GitHub OAuth Authorization Code',
    example: 'gho_16C7e42F292c6912E7710c838347Ae178B4a',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class AuthResponseDto {
  @ApiProperty({ required: false, description: 'Short-lived JWT Access Token' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiProperty({ required: false, description: 'Rotating refresh token string' })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({ required: false, description: 'Access token expiration lifetime in seconds' })
  @IsOptional()
  expiresIn?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  user?: {
    id: string;
    username: string;
    name: string | null;
    email: string | null;
  };

  @ApiProperty({
    required: false,
    description: 'Flag indicating multi-factor TOTP verification is required before full access token issuance',
  })
  @IsOptional()
  is2faRequired?: boolean;

  @ApiProperty({
    required: false,
    description: 'Temporary 5-minute scoped JWT token to authorize 2FA code verification',
  })
  @IsOptional()
  @IsString()
  twoFactorToken?: string;
}

export class TwoFactorGenerateDto {
  @ApiProperty({ required: false, description: 'User ID requesting 2FA secret generation' })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class TwoFactorEnableDto {
  @ApiProperty({ required: false, description: 'User ID activating 2FA' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: '6-digit TOTP passcode from Authenticator app', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'Verification code must be exactly 6 digits' })
  code: string;
}

export class TwoFactorVerifyDto {
  @ApiProperty({
    required: false,
    description: 'Temporary 2FA pending JWT token returned from initial login',
  })
  @IsOptional()
  @IsString()
  twoFactorToken?: string;

  @ApiProperty({
    required: false,
    description: 'User email if verifying directly with credentials',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: '6-digit TOTP code or 8-character single-use emergency recovery code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    required: false,
    description: 'Device or browser client fingerprint string for session tracking',
  })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class TwoFactorDisableDto {
  @ApiProperty({ required: false, description: 'User ID disabling 2FA' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: '6-digit TOTP passcode or backup recovery code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Rotating refresh token to exchange for new access & refresh tokens',
    example: 'd9b7f6c3a1e24567...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({
    required: false,
    description: 'Device or browser client fingerprint string for session tracking',
  })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class LogoutDto {
  @ApiProperty({
    required: false,
    description: 'Refresh token to revoke and blacklist along with its token family',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class EmailPasswordDto {
  @ApiProperty({ example: 'developer@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class RegisterDto extends EmailPasswordDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/\S/, {
    message: 'Name must include at least one non-space character',
  })
  name: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  interests?: string[];
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'developer@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
