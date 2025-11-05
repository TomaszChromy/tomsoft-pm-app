import { Octokit } from '@octokit/rest'
import { prisma } from '@/lib/prisma'

export interface GitHubConfig {
  accessToken: string
  webhookSecret?: string
  syncCommits?: boolean
  syncIssues?: boolean
  syncPRs?: boolean
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  html_url: string
  default_branch: string
  description?: string
  private: boolean
  language?: string
  stargazers_count: number
  forks_count: number
  updated_at: string
}

export interface GitHubCommit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
  url: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body?: string
  state: 'open' | 'closed'
  labels: Array<{ name: string; color: string }>
  assignee?: {
    login: string
    avatar_url: string
  }
  created_at: string
  updated_at: string
  html_url: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  body?: string
  state: 'open' | 'closed' | 'merged'
  head: {
    ref: string
    sha: string
  }
  base: {
    ref: string
    sha: string
  }
  user: {
    login: string
    avatar_url: string
  }
  created_at: string
  updated_at: string
  html_url: string
}

export class GitHubService {
  private octokit: Octokit
  private config: GitHubConfig

  constructor(config: GitHubConfig) {
    this.config = config
    this.octokit = new Octokit({
      auth: config.accessToken,
    })
  }

  // Repository Management
  async getRepositories(): Promise<GitHubRepository[]> {
    try {
      const response = await this.octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      })
      
      return response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        default_branch: repo.default_branch,
        description: repo.description || undefined,
        private: repo.private,
        language: repo.language || undefined,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
      }))
    } catch (error) {
      console.error('Failed to fetch GitHub repositories:', error)
      throw new Error('Failed to fetch repositories from GitHub')
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      })
      
      const repoData = response.data
      return {
        id: repoData.id,
        name: repoData.name,
        full_name: repoData.full_name,
        html_url: repoData.html_url,
        default_branch: repoData.default_branch,
        description: repoData.description || undefined,
        private: repoData.private,
        language: repoData.language || undefined,
        stargazers_count: repoData.stargazers_count,
        forks_count: repoData.forks_count,
        updated_at: repoData.updated_at,
      }
    } catch (error) {
      console.error('Failed to fetch GitHub repository:', error)
      throw new Error('Failed to fetch repository from GitHub')
    }
  }

  // Commits
  async getCommits(owner: string, repo: string, since?: string): Promise<GitHubCommit[]> {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        since,
        per_page: 100,
      })
      
      return response.data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || 'Unknown',
          email: commit.commit.author?.email || '',
          date: commit.commit.author?.date || new Date().toISOString(),
        },
        url: commit.html_url,
      }))
    } catch (error) {
      console.error('Failed to fetch GitHub commits:', error)
      throw new Error('Failed to fetch commits from GitHub')
    }
  }

  // Issues
  async getIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all'): Promise<GitHubIssue[]> {
    try {
      const response = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state,
        per_page: 100,
      })
      
      return response.data
        .filter(issue => !issue.pull_request) // Exclude pull requests
        .map(issue => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body || undefined,
          state: issue.state as 'open' | 'closed',
          labels: issue.labels.map(label => ({
            name: typeof label === 'string' ? label : label.name || '',
            color: typeof label === 'string' ? '' : label.color || '',
          })),
          assignee: issue.assignee ? {
            login: issue.assignee.login,
            avatar_url: issue.assignee.avatar_url,
          } : undefined,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          html_url: issue.html_url,
        }))
    } catch (error) {
      console.error('Failed to fetch GitHub issues:', error)
      throw new Error('Failed to fetch issues from GitHub')
    }
  }

  async createIssue(owner: string, repo: string, title: string, body?: string, labels?: string[]): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.rest.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
      })
      
      const issue = response.data
      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body || undefined,
        state: issue.state as 'open' | 'closed',
        labels: issue.labels.map(label => ({
          name: typeof label === 'string' ? label : label.name || '',
          color: typeof label === 'string' ? '' : label.color || '',
        })),
        assignee: issue.assignee ? {
          login: issue.assignee.login,
          avatar_url: issue.assignee.avatar_url,
        } : undefined,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        html_url: issue.html_url,
      }
    } catch (error) {
      console.error('Failed to create GitHub issue:', error)
      throw new Error('Failed to create issue on GitHub')
    }
  }

  // Pull Requests
  async getPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all'): Promise<GitHubPullRequest[]> {
    try {
      const response = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state,
        per_page: 100,
      })
      
      return response.data.map(pr => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        body: pr.body || undefined,
        state: pr.state as 'open' | 'closed' | 'merged',
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha,
        },
        base: {
          ref: pr.base.ref,
          sha: pr.base.sha,
        },
        user: {
          login: pr.user?.login || 'Unknown',
          avatar_url: pr.user?.avatar_url || '',
        },
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        html_url: pr.html_url,
      }))
    } catch (error) {
      console.error('Failed to fetch GitHub pull requests:', error)
      throw new Error('Failed to fetch pull requests from GitHub')
    }
  }

  // Webhooks
  async createWebhook(owner: string, repo: string, webhookUrl: string, secret?: string): Promise<void> {
    try {
      await this.octokit.rest.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret,
        },
        events: ['push', 'issues', 'pull_request', 'issue_comment'],
      })
    } catch (error) {
      console.error('Failed to create GitHub webhook:', error)
      throw new Error('Failed to create webhook on GitHub')
    }
  }

  // Sync with database
  async syncRepository(integrationId: string, owner: string, repo: string, projectId?: string): Promise<void> {
    try {
      // Get repository info
      const repoInfo = await this.getRepository(owner, repo)
      
      // Save or update repository in database
      await prisma.gitRepository.upsert({
        where: {
          integrationId_repoId: {
            integrationId,
            repoId: repoInfo.id.toString(),
          },
        },
        update: {
          name: repoInfo.name,
          fullName: repoInfo.full_name,
          url: repoInfo.html_url,
          defaultBranch: repoInfo.default_branch,
          projectId,
          lastSyncAt: new Date(),
        },
        create: {
          integrationId,
          provider: 'github',
          repoId: repoInfo.id.toString(),
          name: repoInfo.name,
          fullName: repoInfo.full_name,
          url: repoInfo.html_url,
          defaultBranch: repoInfo.default_branch,
          projectId,
          lastSyncAt: new Date(),
        },
      })

      // Sync commits if enabled
      if (this.config.syncCommits) {
        await this.syncCommits(integrationId, owner, repo)
      }

      // Sync issues if enabled
      if (this.config.syncIssues) {
        await this.syncIssues(integrationId, owner, repo, projectId)
      }

      // Sync pull requests if enabled
      if (this.config.syncPRs) {
        await this.syncPullRequests(integrationId, owner, repo)
      }
    } catch (error) {
      console.error('Failed to sync GitHub repository:', error)
      throw error
    }
  }

  private async syncCommits(integrationId: string, owner: string, repo: string): Promise<void> {
    // Get last commit SHA from database
    const repository = await prisma.gitRepository.findFirst({
      where: {
        integrationId,
        fullName: `${owner}/${repo}`,
      },
    })

    const since = repository?.lastCommitSha ? undefined : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const commits = await this.getCommits(owner, repo, since)

    if (commits.length > 0) {
      // Update last commit SHA
      await prisma.gitRepository.updateMany({
        where: {
          integrationId,
          fullName: `${owner}/${repo}`,
        },
        data: {
          lastCommitSha: commits[0].sha,
        },
      })
    }
  }

  private async syncIssues(integrationId: string, owner: string, repo: string, projectId?: string): Promise<void> {
    const issues = await this.getIssues(owner, repo)
    
    // Here you would create tasks from GitHub issues
    // This is a simplified version - you might want to map GitHub issues to tasks
    console.log(`Synced ${issues.length} issues from ${owner}/${repo}`)
  }

  private async syncPullRequests(integrationId: string, owner: string, repo: string): Promise<void> {
    const pullRequests = await this.getPullRequests(owner, repo)
    
    // Here you would handle pull request data
    // This could create tasks or comments related to code reviews
    console.log(`Synced ${pullRequests.length} pull requests from ${owner}/${repo}`)
  }

  // Utility methods
  static validateConfig(config: any): config is GitHubConfig {
    return config && typeof config.accessToken === 'string'
  }

  static async testConnection(accessToken: string): Promise<boolean> {
    try {
      const octokit = new Octokit({ auth: accessToken })
      await octokit.rest.users.getAuthenticated()
      return true
    } catch {
      return false
    }
  }
}
