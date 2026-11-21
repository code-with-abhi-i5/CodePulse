import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OneTimePreKeyDto {
  @ApiProperty({ description: 'Unique integer identifier for the one-time prekey' })
  keyId!: number;

  @ApiProperty({ description: 'Public X25519 key in base64 / hex format' })
  publicKey!: string;
}

export class PublishPreKeyBundleDto {
  @ApiPropertyOptional({ description: 'Target user ID (inferred from JWT if omitted)' })
  userId?: string;

  @ApiProperty({ description: 'Signal Protocol registration ID' })
  registrationId!: number;

  @ApiProperty({ description: 'Public Identity Key (base64 / hex)' })
  identityKey!: string;

  @ApiProperty({ description: 'Signed PreKey ID' })
  signedPreKeyId!: number;

  @ApiProperty({ description: 'Public Signed PreKey (base64 / hex)' })
  signedPreKey!: string;

  @ApiProperty({ description: 'Cryptographic signature over the signed prekey' })
  signedPreKeySignature!: string;

  @ApiProperty({
    type: [OneTimePreKeyDto],
    description: 'Pool of one-time ephemeral prekeys for X3DH agreement',
  })
  oneTimePreKeys!: OneTimePreKeyDto[];
}

export class PreKeyBundleResponseDto {
  @ApiProperty({ description: 'User ID of the prekey owner' })
  userId!: string;

  @ApiProperty({ description: 'Signal Protocol registration ID' })
  registrationId!: number;

  @ApiProperty({ description: 'Public Identity Key' })
  identityKey!: string;

  @ApiProperty({ description: 'Signed PreKey ID' })
  signedPreKeyId!: number;

  @ApiProperty({ description: 'Public Signed PreKey' })
  signedPreKey!: string;

  @ApiProperty({ description: 'Cryptographic signature of signed prekey' })
  signedPreKeySignature!: string;

  @ApiPropertyOptional({
    type: OneTimePreKeyDto,
    description: 'One-time prekey consumed for this session (null if pool exhausted)',
  })
  oneTimePreKey?: OneTimePreKeyDto;
}

export class EncryptedChatMessageDto {
  @ApiPropertyOptional({ description: 'Target recipient user ID (for direct messaging)' })
  recipientId?: string;

  @ApiPropertyOptional({ description: 'Target team/group ID (for team chat)' })
  teamId?: string;

  @ApiProperty({ description: 'Sender ephemeral ratchet public key (X25519 base64)' })
  ephemeralKey!: string;

  @ApiProperty({ description: 'Message sequence number in current ratchet chain' })
  sequenceNumber!: number;

  @ApiProperty({ description: 'Previous ratchet chain message length' })
  previousChainLength!: number;

  @ApiProperty({ description: 'AES-256-GCM ciphertext payload (base64)' })
  ciphertext!: string;

  @ApiProperty({ description: 'Initialization vector (IV, base64)' })
  iv!: string;

  @ApiProperty({ description: 'GCM authentication tag (base64)' })
  authTag!: string;

  @ApiProperty({ description: 'HMAC-SHA256 message authentication signature (base64)' })
  hmacSignature!: string;
}

export class SafetyNumberQueryDto {
  @ApiProperty({ description: 'User A ID' })
  userAId!: string;

  @ApiProperty({ description: 'User A Public Identity Key' })
  identityKeyA!: string;

  @ApiProperty({ description: 'User B ID' })
  userBId!: string;

  @ApiProperty({ description: 'User B Public Identity Key' })
  identityKeyB!: string;
}

