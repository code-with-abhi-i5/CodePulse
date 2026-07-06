import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { BattleStatus } from '@prisma/client';

export class CreateBattleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  challengerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opponentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  endsAt: string;
}

export class UpdateBattleStatusDto {
  @ApiProperty({ enum: BattleStatus })
  @IsEnum(BattleStatus)
  status: BattleStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  winnerId?: string;
}
