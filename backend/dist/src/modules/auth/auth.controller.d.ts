import { AuthService } from './auth.service';
import { GitHubLoginDto, AuthResponseDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    githubLogin(loginDto: GitHubLoginDto): Promise<AuthResponseDto>;
}
