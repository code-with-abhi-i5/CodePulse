import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubSyncService {
  private readonly logger = new Logger(GithubSyncService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Fetches public stats for any GitHub user.
   * Uses an app-level GitHub token to avoid rate limits if available.
   */
  async fetchPublicStats(username: string, overrideToken?: string) {
    try {
      // Use override token if provided (e.g. user's own token), else fallback to app token
      const token = overrideToken || this.configService.get<string>('GITHUB_TOKEN');
      
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post(
        'https://api.github.com/graphql',
        { query, variables: { username } },
        { headers }
      );

      if (response.data.errors) {
        this.logger.error(`GraphQL errors for ${username}:`, response.data.errors);
        return null;
      }

      const user = response.data.data.user;
      if (!user) return null;

      let totalStars = 0;
      let totalForks = 0;
      const languages: Record<string, number> = {};

      const repos = user.repositories.nodes || [];
      for (const repo of repos) {
        totalStars += repo.stargazerCount || 0;
        totalForks += repo.forkCount || 0;
        
        if (repo.primaryLanguage?.name) {
          const lang = repo.primaryLanguage.name;
          languages[lang] = (languages[lang] || 0) + 1;
        }
      }

      // Find primary language (most used in repos)
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

    } catch (error: any) {
      this.logger.error(`Error fetching public GitHub data for ${username}:`, error.message);
      return null;
    }
  }

  /**
   * Fetches the list of followers/following for a given user.
   */
  async fetchNetwork(username: string, token?: string, type: 'followers' | 'following' = 'following', limit: number = 50) {
    try {
      const actualToken = token || this.configService.get<string>('GITHUB_TOKEN');
      
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (actualToken) headers['Authorization'] = `Bearer ${actualToken}`;

      const response = await axios.post(
        'https://api.github.com/graphql',
        { query, variables: { username, limit } },
        { headers }
      );

      if (response.data.errors) return [];
      
      const nodes = response.data.data.user[type].nodes || [];
      return nodes.map((n: any) => n.login);
    } catch (error: any) {
      this.logger.error(`Error fetching network for ${username}:`, error.message);
      return [];
    }
  }
}
