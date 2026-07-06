"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const sync_service_1 = require("../sync/sync.service");
const axios_1 = __importDefault(require("axios"));
let AuthService = AuthService_1 = class AuthService {
    prisma;
    configService;
    jwtService;
    syncService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, configService, jwtService, syncService) {
        this.prisma = prisma;
        this.configService = configService;
        this.jwtService = jwtService;
        this.syncService = syncService;
    }
    async authenticateWithGitHub(code) {
        try {
            if (!code) {
                throw new common_1.UnauthorizedException('Invalid GitHub code');
            }
            const clientId = this.configService.get('GITHUB_CLIENT_ID');
            const clientSecret = this.configService.get('GITHUB_CLIENT_SECRET');
            const tokenResponse = await axios_1.default.post('https://github.com/login/oauth/access_token', {
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }, {
                headers: {
                    Accept: 'application/json',
                },
            });
            const accessToken = tokenResponse.data.access_token;
            if (!accessToken) {
                this.logger.error('Failed to get access token from GitHub', tokenResponse.data);
                throw new common_1.UnauthorizedException('Failed to get access token from GitHub');
            }
            const userResponse = await axios_1.default.get('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const githubUser = userResponse.data;
            if (!githubUser || !githubUser.id) {
                throw new common_1.UnauthorizedException('Failed to fetch GitHub user profile');
            }
            const githubIdString = String(githubUser.id);
            const user = await this.prisma.user.upsert({
                where: { githubId: githubIdString },
                update: {
                    name: githubUser.name || null,
                    avatar: githubUser.avatar_url || null,
                    bio: githubUser.bio || null,
                    location: githubUser.location || null,
                    company: githubUser.company || null,
                    website: githubUser.blog || null,
                    githubUrl: githubUser.html_url || null,
                    isOnline: true,
                },
                create: {
                    githubId: githubIdString,
                    username: githubUser.login,
                    name: githubUser.name || null,
                    avatar: githubUser.avatar_url || null,
                    bio: githubUser.bio || null,
                    location: githubUser.location || null,
                    company: githubUser.company || null,
                    website: githubUser.blog || null,
                    githubUrl: githubUser.html_url || null,
                    isOnline: true,
                },
            });
            this.syncService.syncUserData(user.id, user.username, accessToken)
                .catch(err => this.logger.error(`Background sync failed for ${user.username}`, err));
            const payload = { sub: user.id, githubId: user.githubId, username: user.username };
            const jwtToken = this.jwtService.sign(payload);
            return {
                accessToken: jwtToken,
                user: {
                    id: user.id,
                    username: user.username,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to authenticate with GitHub', error.message);
            throw new common_1.UnauthorizedException('Failed to authenticate with GitHub');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService,
        sync_service_1.SyncService])
], AuthService);
//# sourceMappingURL=auth.service.js.map