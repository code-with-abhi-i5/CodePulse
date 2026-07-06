import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GitHubLoginDto, AuthResponseDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('github')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate using GitHub OAuth code' })
  @ApiResponse({ status: 200, description: 'Successful authentication', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired GitHub code' })
  async githubLogin(@Body() loginDto: GitHubLoginDto): Promise<AuthResponseDto> {
    return this.authService.authenticateWithGitHub(loginDto.code);
  }
}
