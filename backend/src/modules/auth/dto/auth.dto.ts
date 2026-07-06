import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

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
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: any; // We will replace with UserDto later
}
