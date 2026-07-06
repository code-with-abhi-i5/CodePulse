import { PrismaService } from '../../prisma/prisma.service';
import { AuthResponseDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SyncService } from '../sync/sync.service';
export declare class AuthService {
    private readonly prisma;
    private readonly configService;
    private readonly jwtService;
    private readonly syncService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, jwtService: JwtService, syncService: SyncService);
    authenticateWithGitHub(code: string): Promise<AuthResponseDto>;
}
