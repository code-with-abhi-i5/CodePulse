import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(private configService: ConfigService) {}

  async fetchUserData(username: string, accessToken: string) {
    try {
      const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              commitContributionsByRepository(maxRepositories: 5) {
                repository {
                  name
                }
                contributions(first: 1) {
                  totalCount
                }
              }
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
            starredRepositories(first: 10, orderBy: {field: STARRED_AT, direction: DESC}) {
              edges {
                starredAt
                node {
                  name
                }
              }
            }
            socialAccounts(first: 5) {
              nodes {
                provider
                url
              }
            }
          }
        }
      `;

      const response = await axios.post(
        'https://api.github.com/graphql',
        { query, variables: { username } },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.errors) {
        this.logger.error('GraphQL errors:', response.data.errors);
        throw new Error('Failed to fetch GitHub data');
      }

      return response.data.data.user;
    } catch (error: any) {
      this.logger.error(`Error fetching GitHub data for ${username}:`, error.message);
      return null;
    }
  }
  async fetchUserEvents(username: string, accessToken: string) {
    try {
      const response = await axios.get(`https://api.github.com/users/${username}/events`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          per_page: 30, // Get the last 30 events
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching GitHub events for ${username}:`, error.message);
      return [];
    }
  }
}
