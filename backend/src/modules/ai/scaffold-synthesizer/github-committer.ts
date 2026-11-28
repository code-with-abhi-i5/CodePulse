import { Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { GeneratedFile } from './code-generator';

export interface GitHubCommitOptions {
  token?: string;
  owner: string;
  repo: string;
  baseBranch?: string; // default 'main'
  targetBranch: string;
  commitMessage?: string;
}

export class GitHubCommitter {
  private readonly logger = new Logger(GitHubCommitter.name);

  /**
   * Commits the synthesized files to a new or existing branch in a GitHub repository.
   */
  public async commitToBranch(
    files: GeneratedFile[],
    options: GitHubCommitOptions,
  ): Promise<{ branchUrl: string; commitSha: string; branch: string }> {
    const token = options.token || process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        'GitHub authentication token is required for direct branch commit (set GITHUB_TOKEN or provide in request)',
      );
    }

    const octokit = new Octokit({ auth: token });
    const { owner, repo, baseBranch = 'main', targetBranch, commitMessage } = options;

    this.logger.log(
      `Committing ${files.length} synthesized files to GitHub repo ${owner}/${repo} on branch ${targetBranch}`,
    );

    // 1. Get the latest commit SHA from the base branch
    const { data: baseRef } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });
    const latestCommitSha = baseRef.object.sha;

    // 2. Create the target branch if it doesn't already exist
    try {
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${targetBranch}`,
        sha: latestCommitSha,
      });
      this.logger.log(`Created new branch refs/heads/${targetBranch} at ${latestCommitSha}`);
    } catch (err: any) {
      // 422 indicates branch already exists, which is acceptable
      if (err.status !== 422) {
        throw err;
      }
      this.logger.log(`Branch ${targetBranch} already exists, updating in-place.`);
    }

    // 3. Create Git Blobs and build tree
    const treePayload: Array<{
      path: string;
      mode: '100644';
      type: 'blob';
      content: string;
    }> = files.map((f) => ({
      path: f.path,
      mode: '100644',
      type: 'blob',
      content: f.content,
    }));

    const { data: tree } = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: latestCommitSha,
      tree: treePayload,
    });

    // 4. Create Git Commit
    const message =
      commitMessage ||
      `feat(scaffold): synthesize NestJS architecture from Mermaid diagram\n\nGenerated files:\n${files
        .map((f) => `- ${f.path}`)
        .join('\n')}`;

    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      tree: tree.sha,
      parents: [latestCommitSha],
    });

    // 5. Update branch reference to point to new commit
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${targetBranch}`,
      sha: newCommit.sha,
      force: true,
    });

    const branchUrl = `https://github.com/${owner}/${repo}/tree/${targetBranch}`;
    this.logger.log(`Successfully pushed commit ${newCommit.sha} to ${branchUrl}`);

    return {
      branchUrl,
      commitSha: newCommit.sha,
      branch: targetBranch,
    };
  }
}
