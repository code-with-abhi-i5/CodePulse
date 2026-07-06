import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SyncGitHubProfileDto {
  @ApiProperty({
    description: 'The GitHub username to sync',
    example: 'torvalds',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
