import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CompareDevelopersDto {
  @ApiProperty({ example: 'dev_alpha' })
  @IsString()
  @IsNotEmpty()
  username1: string;

  @ApiProperty({ example: 'dev_beta' })
  @IsString()
  @IsNotEmpty()
  username2: string;
}
