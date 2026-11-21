import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PreKeyService } from './prekey.service';
import {
  PublishPreKeyBundleDto,
  PreKeyBundleResponseDto,
  EncryptedChatMessageDto,
  SafetyNumberQueryDto,
} from './dto/prekey.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('crypto-e2ee')
@Controller('auth/prekeys')
export class KeysController {
  constructor(private readonly preKeyService: PreKeyService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publish or replenish Signal Protocol PreKey bundle (IdentityKey + SignedPreKey + OTPKs)',
  })
  @ApiResponse({
    status: 200,
    description: 'PreKey bundle published successfully',
  })
  async publishPreKeyBundle(
    @Body() dto: PublishPreKeyBundleDto,
    @Req() req?: any,
  ) {
    const userId = dto.userId || req?.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID must be provided in body or authenticated session');
    }
    return this.preKeyService.publishPreKeyBundle(userId, dto);
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Fetch recipient PreKey bundle for X3DH session establishment (atomically pops one OTPK)',
  })
  @ApiParam({ name: 'userId', description: 'Target user ID to establish session with' })
  @ApiResponse({
    status: 200,
    description: 'PreKey bundle retrieved with active One-Time PreKey',
    type: PreKeyBundleResponseDto,
  })
  async getPreKeyBundle(@Param('userId') userId: string) {
    return this.preKeyService.getPreKeyBundle(userId);
  }

  @Get(':userId/status')
  @ApiOperation({
    summary: 'Check available unused One-Time PreKeys count for a user',
  })
  @ApiParam({ name: 'userId', description: 'User ID to check' })
  async getPreKeysStatus(@Param('userId') userId: string) {
    return this.preKeyService.getRemainingPreKeysCount(userId);
  }

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Store client-encrypted ciphertext message (zero server access to plaintext or private keys)',
  })
  @ApiResponse({
    status: 201,
    description: 'Encrypted message ciphertext stored successfully',
  })
  async storeEncryptedMessage(
    @Body() dto: EncryptedChatMessageDto,
    @Req() req?: any,
  ) {
    const senderId = req?.user?.id || 'anonymous-sender';
    return this.preKeyService.storeEncryptedMessage(senderId, dto);
  }

  @Get('messages')
  @ApiOperation({
    summary: 'Retrieve encrypted messages for direct message recipient or team room',
  })
  @ApiQuery({ name: 'recipientId', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEncryptedMessages(
    @Query('recipientId') recipientId?: string,
    @Query('teamId') teamId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.preKeyService.getEncryptedMessages({
      recipientId,
      teamId,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Post('safety-number')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compute or verify Signal Safety Number fingerprint between two participants',
  })
  @ApiResponse({
    status: 200,
    description: 'Deterministic 60-digit safety number fingerprint',
  })
  async calculateSafetyNumber(@Body() dto: SafetyNumberQueryDto) {
    if (!dto.userAId || !dto.userBId || !dto.identityKeyA || !dto.identityKeyB) {
      throw new BadRequestException('userAId, userBId, and both identity keys are required');
    }
    const fingerprint = this.preKeyService.computeSafetyNumber(
      dto.userAId,
      dto.identityKeyA,
      dto.userBId,
      dto.identityKeyB,
    );
    return {
      userAId: dto.userAId,
      userBId: dto.userBId,
      safetyNumber: fingerprint,
    };
  }
}
