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
var GithubService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("@nestjs/config");
let GithubService = GithubService_1 = class GithubService {
    configService;
    logger = new common_1.Logger(GithubService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async fetchUserData(username, accessToken) {
        try {
            const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
              totalCommitContributions
              totalPullRequestContributions
              totalIssueContributions
              totalRepositoryContributions
            }
            repositories(first: 100, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER], orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes {
                id
                name
                nameWithOwner
                description
                url
                updatedAt
                repositoryTopics(first: 5) {
                  nodes {
                    topic {
                      name
                    }
                  }
                }
                primaryLanguage {
                  name
                  color
                }
                stargazerCount
                forkCount
                createdAt
                issues(states: OPEN) {
                  totalCount
                }
                pullRequests(states: OPEN) {
                  totalCount
                }
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history {
                        totalCount
                      }
                    }
                  }
                }
              }
            }
            followers {
              totalCount
            }
            following {
              totalCount
            }
            pullRequests(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes {
                title
                createdAt
                repository {
                  name
                }
              }
            }
            issues(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes {
                title
                createdAt
                repository {
                  name
                }
              }
            }
          }
        }
      `;
            const response = await axios_1.default.post('https://api.github.com/graphql', { query, variables: { username } }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (response.data.errors) {
                this.logger.error('GraphQL errors:', response.data.errors);
                throw new Error('Failed to fetch GitHub data');
            }
            return response.data.data.user;
        }
        catch (error) {
            this.logger.error(`Error fetching GitHub data for ${username}:`, error.message);
            return null;
        }
    }
};
exports.GithubService = GithubService;
exports.GithubService = GithubService = GithubService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GithubService);
//# sourceMappingURL=github.service.js.map