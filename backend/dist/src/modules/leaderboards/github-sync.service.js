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
var GithubSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubSyncService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("@nestjs/config");
let GithubSyncService = GithubSyncService_1 = class GithubSyncService {
    configService;
    logger = new common_1.Logger(GithubSyncService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async fetchPublicStats(username, overrideToken) {
        try {
            const token = overrideToken || this.configService.get('GITHUB_TOKEN');
            const query = `
        query($username: String!) {
          user(login: $username) {
            id
            login
            name
            avatarUrl
            bio
            company
            location
            followers { totalCount }
            following { totalCount }
            repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
              totalCount
              nodes {
                stargazerCount
                forkCount
                primaryLanguage {
                  name
                }
              }
            }
          }
        }
      `;
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await axios_1.default.post('https://api.github.com/graphql', { query, variables: { username } }, { headers });
            if (response.data.errors) {
                this.logger.error(`GraphQL errors for ${username}:`, response.data.errors);
                return null;
            }
            const user = response.data.data.user;
            if (!user)
                return null;
            let totalStars = 0;
            let totalForks = 0;
            const languages = {};
            const repos = user.repositories.nodes || [];
            for (const repo of repos) {
                totalStars += repo.stargazerCount || 0;
                totalForks += repo.forkCount || 0;
                if (repo.primaryLanguage?.name) {
                    const lang = repo.primaryLanguage.name;
                    languages[lang] = (languages[lang] || 0) + 1;
                }
            }
            let primaryLanguage = null;
            let maxCount = 0;
            for (const [lang, count] of Object.entries(languages)) {
                if (count > maxCount) {
                    maxCount = count;
                    primaryLanguage = lang;
                }
            }
            return {
                githubId: user.id,
                username: user.login,
                name: user.name,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                company: user.company,
                location: user.location,
                primaryLanguage,
                followers: user.followers.totalCount,
                following: user.following.totalCount,
                publicRepos: user.repositories.totalCount,
                totalStars,
                totalForks,
            };
        }
        catch (error) {
            this.logger.error(`Error fetching public GitHub data for ${username}:`, error.message);
            return null;
        }
    }
    async fetchNetwork(username, token, type = 'following', limit = 50) {
        try {
            const actualToken = token || this.configService.get('GITHUB_TOKEN');
            const query = `
        query($username: String!, $limit: Int!) {
          user(login: $username) {
            ${type}(first: $limit) {
              nodes {
                login
              }
            }
          }
        }
      `;
            const headers = {
                'Content-Type': 'application/json',
            };
            if (actualToken)
                headers['Authorization'] = `Bearer ${actualToken}`;
            const response = await axios_1.default.post('https://api.github.com/graphql', { query, variables: { username, limit } }, { headers });
            if (response.data.errors)
                return [];
            const nodes = response.data.data.user[type].nodes || [];
            return nodes.map((n) => n.login);
        }
        catch (error) {
            this.logger.error(`Error fetching network for ${username}:`, error.message);
            return [];
        }
    }
};
exports.GithubSyncService = GithubSyncService;
exports.GithubSyncService = GithubSyncService = GithubSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GithubSyncService);
//# sourceMappingURL=github-sync.service.js.map