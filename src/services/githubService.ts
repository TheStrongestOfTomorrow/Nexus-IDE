import axios from 'axios';

// ============================================================
// Constants
// ============================================================

const API_BASE = '/api/github';
const CURRENT_VERSION = '5.2.0';

// ============================================================
// Types / Interfaces
// ============================================================

export interface RepoInfo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  description: string | null;
  html_url: string;
  default_branch: string;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  topics: string[];
  license: { key: string; name: string; spdx_id: string } | null;
}

export interface CommitItem {
  sha: string;
  commit: {
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
    message: string;
    tree: { sha: string; url: string };
  };
  author: { login: string; avatar_url: string; html_url: string } | null;
  committer: { login: string; avatar_url: string; html_url: string } | null;
  parents: { sha: string; url: string; html_url: string }[];
  stats?: { additions: number; deletions: number; total: number };
  files?: CommitFile[];
}

export interface CommitFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: 'added' | 'modified' | 'removed' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  patch?: string;
  previous_filename?: string;
}

export interface BranchItem {
  name: string;
  commit: { sha: string; url: string };
  protected: boolean;
}

export interface TreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  size?: number;
  sha: string;
  url: string;
}

export interface GitTree {
  sha: string;
  url: string;
  tree: TreeItem[];
  truncated: boolean;
}

export interface ContentResponse {
  content: string;
  encoding: string;
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  download_url: string | null;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
}

export interface CompareResult {
  status: string;
  ahead_by: number;
  behind_by: number;
  total_commits: number;
  commits: CommitItem[];
  files: CommitFile[];
}

export interface PullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed' | 'all';
  title: string;
  body: string | null;
  html_url: string;
  user: { login: string; avatar_url: string };
  head: { label: string; ref: string; sha: string; repo: RepoInfo };
  base: { label: string; ref: string; sha: string; repo: RepoInfo };
  mergeable: boolean | null;
  merged: boolean;
  created_at: string;
  updated_at: string;
}

export interface MergeResult {
  sha: string;
  merged: boolean;
  message: string;
}

export interface Issue {
  id: number;
  number: number;
  state: 'open' | 'closed' | 'all';
  title: string;
  body: string | null;
  html_url: string;
  user: { login: string; avatar_url: string };
  labels: { id: number; name: string; color: string }[];
  assignee: { login: string; avatar_url: string } | null;
  created_at: string;
  updated_at: string;
  comments: number;
  pull_request?: Record<string, unknown>;
}

export interface Release {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
}

export interface CommitsOptions {
  sha?: string;
  per_page?: number;
  page?: number;
  path?: string;
}

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  release: Release | null;
}

// ============================================================
// Helpers
// ============================================================

function authHeaders(token: string) {
  return { Authorization: `token ${token}` };
}

/** Compare two semver strings like "5.1.0" vs "5.2.0". Returns >0, =0, or <0. */
function semverCompare(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

// ============================================================
// GitHub Service
// ============================================================

export const githubService = {
  // --------------------------------------------------------
  // Auth
  // --------------------------------------------------------

  /** Get the GitHub OAuth authorization URL */
  getAuthUrl: async (): Promise<string> => {
    const response = await axios.get('/api/auth/github/url');
    return response.data.url;
  },

  // --------------------------------------------------------
  // User & Repos
  // --------------------------------------------------------

  /** Get the authenticated GitHub user profile */
  getUser: async (token: string) => {
    const response = await axios.get(`${API_BASE}/user`, {
      headers: authHeaders(token),
    });
    return response.data;
  },

  /** List repositories for the authenticated user */
  getRepos: async (token: string) => {
    const response = await axios.get(`${API_BASE}/repos`, {
      headers: authHeaders(token),
    });
    return response.data;
  },

  /** Create a new GitHub repository */
  createRepo: async (
    token: string,
    name: string,
    description: string,
    isPrivate: boolean,
    license?: string,
  ) => {
    const response = await axios.post(
      `${API_BASE}/repos`,
      { name, description, private: isPrivate, license_template: license },
      { headers: authHeaders(token) },
    );
    return response.data;
  },

  // --------------------------------------------------------
  // Repo Info
  // --------------------------------------------------------

  /** Get metadata for a repository (default branch, description, etc.) */
  getRepoInfo: async (token: string, owner: string, repo: string): Promise<RepoInfo> => {
    const response = await axios.get(`${API_BASE}/repos/${owner}/${repo}/info`, {
      headers: authHeaders(token),
    });
    return response.data;
  },

  // --------------------------------------------------------
  // Contents / Files
  // --------------------------------------------------------

  /** Get contents of a file or directory at a given path */
  getRepoContents: async (
    token: string,
    owner: string,
    repo: string,
    path: string = '',
  ): Promise<ContentResponse | ContentResponse[]> => {
    const response = await axios.get(
      `${API_BASE}/repos/${owner}/${repo}/contents/${path}`,
      { headers: authHeaders(token) },
    );
    return response.data;
  },

  /** Create or update a single file via the GitHub Contents API */
  createOrUpdateFile: async (
    token: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
  ) => {
    const body: Record<string, unknown> = { message, content: btoa(unescape(encodeURIComponent(content))) };
    if (sha) body.sha = sha;
    const response = await axios.put(
      `${API_BASE}/repos/${owner}/${repo}/contents/${path}`,
      body,
      { headers: authHeaders(token) },
    );
    return response.data;
  },

  /** Delete a single file via the GitHub Contents API */
  deleteFile: async (
    token: string,
    owner: string,
    repo: string,
    path: string,
    message: string,
    sha: string,
  ) => {
    const response = await axios.delete(
      `${API_BASE}/repos/${owner}/${repo}/contents/${path}`,
      {
        data: { message, sha },
        headers: authHeaders(token),
      },
    );
    return response.data;
  },

  /** Push multiple files in a single commit (uses the Git Data API proxy) */
  pushFiles: async (
    token: string,
    owner: string,
    repo: string,
    message: string,
    files: { path: string; content: string }[],
  ) => {
    const response = await axios.post(
      `${API_BASE}/repos/${owner}/${repo}/push`,
      { message, files },
      { headers: authHeaders(token) },
    );
    return response.data;
  },

  /** Recursively fetch all files in a repository */
  fetchAllFiles: async (
    token: string,
    owner: string,
    repo: string,
    path: string = '',
  ): Promise<{ name: string; content: string; path: string }[]> => {
    try {
      const contents = await githubService.getRepoContents(token, owner, repo, path);
      let files: { name: string; content: string; path: string }[] = [];

      const items = Array.isArray(contents) ? contents : [contents];

      for (const item of items) {
        try {
          if (item.type === 'file') {
            if (!item.download_url) {
              console.warn(`Skipping ${item.path}: download_url is null`);
              continue;
            }
            const fileData = await axios.get(item.download_url);
            files.push({
              name: item.name,
              path: item.path,
              content:
                typeof fileData.data === 'object'
                  ? JSON.stringify(fileData.data, null, 2)
                  : fileData.data,
            });
          } else if (item.type === 'dir') {
            const subFiles = await githubService.fetchAllFiles(token, owner, repo, item.path);
            files = [...files, ...subFiles];
          }
        }catch (itemErr) {
          console.error(`Failed to fetch ${item.path}:`, itemErr);
        }
      }
      return files;
    } catch (err) {
      console.error('Failed to fetch repository contents:', err);
      return [];
    }
  },

  // --------------------------------------------------------
  // Git Trees
  // --------------------------------------------------------

  /** Get a Git tree (optionally recursive) for a given ref */
  getTree: async (
    token: string,
    owner: string,
    repo: string,
    ref: string,
    recursive: boolean = false,
  ): Promise<GitTree> => {
    const params: Record<string, string> = {};
    if (recursive) params.recursive = '1';
    const response = await axios.get(
      `${API_BASE}/repos/${owner}/${repo}/git/trees/${ref}`,
      { params, headers: authHeaders(token) },
    );
    return response.data;
  },

  // --------------------------------------------------------
  // Commits
  // --------------------------------------------------------

  /** List commits for a repository with optional filters */
  getCommits: async (
    token: string,
    owner: string,
    repo: string,
    opts?: CommitsOptions,
  ): Promise<CommitItem[]> => {
    const params: Record<string, unknown> = {};
    if (opts?.sha) params.sha = opts.sha;
    if (opts?.per_page) params.per_page = opts.per_page;
    if (opts?.page) params.page = opts.page;
    if (opts?.path) params.path = opts.path;
    const response = await axios.get(`${API_BASE}/repos/${owner}/${repo}/commits`, {
      params,
      headers: authHeaders(token),
    });
    return response.data;
  },

  /** Get detailed information about a single commit */
  getCommit: async (
    token: string,
    owner: string,
    repo: string,
    sha: string,
  ): Promise<CommitItem> => {
    const response = await axios.get(
      `${API_BASE}/repos/${owner}/${repo}/commits/${sha}`,
      { headers: authHeaders(token) },
    );
    return response.data;
  },

  // --------------------------------------------------------
  // Branches
  // --------------------------------------------------------

  /** List branches for a repository */
  getBranches: async (token: string, owner: string, repo: string): Promise<BranchItem[]> => {
    const response = await axios.get(`${API_BASE}/repos/${owner}/${repo}/branches`, {
      headers: authHeaders(token),
    });
    return response.data;
  },

  /** Create a new branch from a given commit SHA */
  createBranch: async (
    token: string,
    owner: string,
    repo: string,
    name: string,
    fromSha: string,
  ) => {
    const response = await axios.post(
      `${API_BASE}/repos/${owner}/${repo}/git/refs`,
      { ref: `refs/heads/${name}`, sha: fromSha },
      { headers: authHeaders(token) },
    );
    return response.data;
  },

  /** Delete a branch */
  deleteBranch: async (token: string, owner: string, repo: string, branch: string) => {
    const response = await axios.delete(
      `${API_BASE}/repos/${owner}/${repo}/branches/${branch}`,
      { headers: authHeaders(token) },
    );
    return response.data;
  },

  // --------------------------------------------------------
  // Compare
  // --------------------------------------------------------

  /** Compare two refs (branches, SHAs, tags) */
  compareBranches: async (
    token: string,
    owner: string,
    repo: string,
    base: string,
    head: string,
  ): Promise<CompareResult> => {
    const response = await axios.get(
      `${API_BASE}/repos/${owner}/${repo}/compare/${base}...${head}`,
      { headers: authHeaders(token) },
    );
    return response.data;
  },

  // --------------------------------------------------------
  // Pull Requests
  // --------------------------------------------------------

  /** List pull requests with optional state filter */
  getPullRequests: async (
    token: string,
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open',
  ): Promise<PullRequest[]> => {
    const response = await axios.get(`${API_BASE}/repos/${owner}/${repo}/pulls`, {
      params: { state },
      headers: authHeaders(token),
    });
    return response.data;
  },

  /** Create a new pull request */
  createPullRequest: async (
    token: string,
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string,
  ): Promise<PullRequest> => {
    const response = await axios.post(
      `${API_BASE}/repos/${owner}/${repo}/pulls`,
      { title, head, base, body },
      { headers: authHeaders(token) },
    );
    return response.data;
  },

  /** Merge a pull request */
  mergePullRequest: async (
    token: string,
    owner: string,
    repo: string,
    number: number,
  ): Promise<MergeResult> => {
    const response = await axios.put(
      `${API_BASE}/repos/${owner}/${repo}/pulls/${number}/merge`,
      {},
      { headers: authHeaders(token) },
    );
    return response.data;
  },

  // --------------------------------------------------------
  // Issues
  // --------------------------------------------------------

  /** List issues (excluding PRs) with optional state filter */
  getIssues: async (
    token: string,
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open',
  ): Promise<Issue[]> => {
    const response = await axios.get(`${API_BASE}/repos/${owner}/${repo}/issues`, {
      params: { state },
      headers: authHeaders(token),
    });
    // GitHub Issues API returns PRs too when listing issues; filter them out
    return (response.data as Issue[]).filter((item) => !item.pull_request);
  },

  /** Create a new issue */
  createIssue: async (
    token: string,
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels?: string[],
  ): Promise<Issue> => {
    const payload: Record<string, unknown> = { title, body };
    if (labels && labels.length > 0) payload.labels = labels;
    const response = await axios.post(
      `${API_BASE}/repos/${owner}/${repo}/issues`,
      payload,
      { headers: authHeaders(token) },
    );
    return response.data;
  },

  // --------------------------------------------------------
  // Releases / Updates
  // --------------------------------------------------------

  /** Get the latest release of Nexus-IDE from GitHub */
  getLatestRelease: async (token?: string): Promise<Release> => {
    const headers: Record<string, string> = {};
    if (token) Object.assign(headers, authHeaders(token));
    const response = await axios.get('/api/github-proxy/latest-release', { headers });
    return response.data;
  },

  /** Check if a newer version of Nexus-IDE is available */
  checkForUpdates: async (token?: string): Promise<UpdateCheckResult> => {
    try {
      const release = await githubService.getLatestRelease(token);
      const latestVersion = release.tag_name.replace(/^v/, '');
      const hasUpdate = semverCompare(latestVersion, CURRENT_VERSION) > 0;
      return {
        currentVersion: CURRENT_VERSION,
        latestVersion,
        hasUpdate,
        release,
      };
    } catch (err) {
      console.error('Failed to check for updates:', err);
      return {
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        hasUpdate: false,
        release: null,
      };
    }
  },
};
