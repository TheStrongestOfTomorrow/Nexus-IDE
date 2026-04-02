import axios from 'axios';

const API_BASE = 'https://api.github.com';

function headers(token: string) {
  return { Authorization: `token ${token}` };
}

// --- Types ---

export interface Commit {
  sha: string;
  commit: {
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
    message: string;
  };
  author: { login: string; avatar_url: string } | null;
  html_url: string;
  stats?: { additions: number; deletions: number; total: number };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
}

export interface Branch {
  name: string;
  commit: { sha: string; url: string };
  protected: boolean;
}

export interface TreeEntry {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  user: { login: string; avatar_url: string } | null;
  body: string;
  head: { ref: string; label: string; repo: { full_name: string } };
  base: { ref: string; label: string; repo: { full_name: string } };
  created_at: string;
  updated_at: string;
  mergeable: boolean | null;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  user: { login: string; avatar_url: string } | null;
  body: string;
  labels: Array<{ name: string; color: string }>;
  created_at: string;
  updated_at: string;
}

export interface RepoInfo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  description: string | null;
  default_branch: string;
  private: boolean;
  html_url: string;
  updated_at: string;
}

export interface CompareResult {
  status: string;
  ahead_by: number;
  behind_by: number;
  total_commits: number;
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch?: string;
  }>;
}

export interface FileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
}

export interface StagedFileEntry {
  path: string;
  content: string;
  status: 'modified' | 'added' | 'untracked';
}

// --- In-Memory Staging Area ---

const stagingArea = new Map<string, string>();

// --- Service ---

export const gitService = {
  // =====================
  // STAGING OPERATIONS
  // =====================

  stageFile(filePath: string, content: string): void {
    stagingArea.set(filePath, content);
  },

  unstageFile(filePath: string): void {
    stagingArea.delete(filePath);
  },

  getStagedFiles(): StagedFileEntry[] {
    const result: StagedFileEntry[] = [];
    stagingArea.forEach((content, path) => {
      result.push({ path, content, status: 'modified' });
    });
    return result;
  },

  clearStagingArea(): void {
    stagingArea.clear();
  },

  getStagedPaths(): string[] {
    return Array.from(stagingArea.keys());
  },

  // =====================
  // WORKSPACE DIFF
  // =====================

  getUnstagedChanges(files: Array<{ name: string; content: string; originalContent?: string | null }>): StagedFileEntry[] {
    const stagedPaths = new Set(stagingArea.keys());
    return files
      .filter(f => !stagedPaths.has(f.name))
      .filter(f => {
        const hasOriginal = f.originalContent !== undefined && f.originalContent !== null && f.originalContent !== '';
        const isModified = hasOriginal && f.content !== f.originalContent;
        const isNew = !hasOriginal && f.content !== '';
        return isModified || isNew;
      })
      .map(f => {
        const hasOriginal = f.originalContent !== undefined && f.originalContent !== null && f.originalContent !== '';
        return {
          path: f.name,
          content: f.content,
          status: hasOriginal ? 'modified' as const : 'added' as const,
        };
      });
  },

  // =====================
  // COMMITS
  // =====================

  async getCommitHistory(
    token: string,
    owner: string,
    repo: string,
    branch?: string,
    perPage = 10,
    page = 1
  ): Promise<Commit[]> {
    const params: Record<string, string | number> = { per_page: perPage, page };
    if (branch) params.sha = branch;
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/commits`, {
      params,
      headers: headers(token),
    });
    return res.data;
  },

  async getSingleCommit(token: string, owner: string, repo: string, sha: string): Promise<Commit> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/commits/${sha}`, {
      headers: headers(token),
    });
    return res.data;
  },

  async getCommitDiff(token: string, owner: string, repo: string, sha: string): Promise<Commit> {
    return this.getSingleCommit(token, owner, repo, sha);
  },

  async getFileHistory(
    token: string,
    owner: string,
    repo: string,
    filePath: string,
    branch?: string
  ): Promise<Commit[]> {
    const params: Record<string, string> = { path: filePath };
    if (branch) params.sha = branch;
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/commits`, {
      params,
      headers: headers(token),
    });
    return res.data;
  },

  // =====================
  // GIT DATA API: PROPER COMMIT
  // =====================

  /**
   * Create a proper Git commit using the GitHub Git Data API.
   * 1. Create blobs for each staged file
   * 2. Get the current tree SHA for the branch
   * 3. Create a new tree with the updated blobs
   * 4. Create a commit pointing to the new tree
   * 5. Update the branch ref to point to the new commit
   */
  async commit(
    token: string,
    owner: string,
    repo: string,
    branch: string,
    message: string,
    stagedFiles: StagedFileEntry[]
  ): Promise<Commit> {
    if (stagedFiles.length === 0) {
      throw new Error('No files to commit');
    }

    // Step 1: Create blobs for each staged file
    const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = [];

    for (const file of stagedFiles) {
      const blobRes = await axios.post(
        `${API_BASE}/repos/${owner}/${repo}/git/blobs`,
        {
          content: file.content,
          encoding: 'utf-8',
        },
        { headers: headers(token) }
      );
      treeEntries.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobRes.data.sha,
      });
    }

    // Step 2: Get the current branch's latest commit SHA (base tree)
    const refRes = await axios.get(
      `${API_BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      { headers: headers(token) }
    );
    const baseSha = refRes.data.object.sha;

    // Step 3: Create a new tree with the updated blobs
    // We use base_tree to keep all other files unchanged
    const treeRes = await axios.post(
      `${API_BASE}/repos/${owner}/${repo}/git/trees`,
      {
        base_tree: baseSha,
        tree: treeEntries,
      },
      { headers: headers(token) }
    );

    // Step 4: Create the commit
    const commitRes = await axios.post(
      `${API_BASE}/repos/${owner}/${repo}/git/commits`,
      {
        message,
        tree: treeRes.data.sha,
        parents: [baseSha],
      },
      { headers: headers(token) }
    );

    const newCommitSha = commitRes.data.sha;

    // Step 5: Update the branch ref to point to the new commit
    await axios.patch(
      `${API_BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        sha: newCommitSha,
        force: false,
      },
      { headers: headers(token) }
    );

    // Fetch the full commit details to return
    return this.getSingleCommit(token, owner, repo, newCommitSha);
  },

  // =====================
  // BRANCHES
  // =====================

  async getBranches(token: string, owner: string, repo: string): Promise<Branch[]> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/branches`, {
      headers: headers(token),
    });
    return res.data;
  },

  async createBranch(
    token: string,
    owner: string,
    repo: string,
    branchName: string,
    fromBranch?: string
  ): Promise<Branch> {
    let sha: string | undefined;
    if (!fromBranch) {
      const repoInfo = await this.getRepoInfo(token, owner, repo);
      const refRes = await axios.get(
        `${API_BASE}/repos/${owner}/${repo}/git/refs/heads/${repoInfo.default_branch}`,
        { headers: headers(token) }
      );
      sha = refRes.data.object.sha;
    } else {
      const refRes = await axios.get(
        `${API_BASE}/repos/${owner}/${repo}/git/refs/heads/${fromBranch}`,
        { headers: headers(token) }
      );
      sha = refRes.data.object.sha;
    }

    const res = await axios.post(
      `${API_BASE}/repos/${owner}/${repo}/git/refs`,
      { ref: `refs/heads/${branchName}`, sha },
      { headers: headers(token) }
    );
    return { name: branchName, commit: { sha: res.data.object.sha, url: res.data.object.url }, protected: false };
  },

  async deleteBranch(token: string, owner: string, repo: string, branchName: string): Promise<void> {
    await axios.delete(`${API_BASE}/repos/${owner}/${repo}/branches/${branchName}`, {
      headers: headers(token),
    });
  },

  // =====================
  // TREE
  // =====================

  async getTree(
    token: string,
    owner: string,
    repo: string,
    branch: string,
    treePath?: string
  ): Promise<TreeEntry[]> {
    const ref = treePath ? `${branch}:${treePath}` : branch;
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/git/trees/${ref}`, {
      params: { recursive: 1 },
      headers: headers(token),
    });
    return res.data.tree;
  },

  // =====================
  // FILE CONTENTS
  // =====================

  async getFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<FileContent> {
    const params: Record<string, string> = {};
    if (ref) params.ref = ref;
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
      params,
      headers: headers(token),
    });
    return res.data;
  },

  async createOrUpdateFile(
    token: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    branch?: string
  ): Promise<{ commit: { sha: string }; content: { sha: string } }> {
    const body: Record<string, unknown> = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
    };
    if (sha) body.sha = sha;
    if (branch) body.branch = branch;

    const res = await axios.put(
      `${API_BASE}/repos/${owner}/${repo}/contents/${path}`,
      body,
      { headers: headers(token) }
    );
    return res.data;
  },

  async deleteFile(
    token: string,
    owner: string,
    repo: string,
    path: string,
    message: string,
    sha: string,
    branch?: string
  ): Promise<void> {
    const body: Record<string, unknown> = { message, sha };
    if (branch) body.branch = branch;

    await axios.delete(`${API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
      data: body,
      headers: headers(token),
    });
  },

  // =====================
  // CLONE / PULL
  // =====================

  /**
   * Clone a repository: fetch all files from a branch and return structured data.
   * Reuses the Contents API to recursively fetch all files.
   */
  async cloneRepo(
    token: string,
    owner: string,
    repo: string,
    branch?: string
  ): Promise<Array<{ name: string; path: string; content: string }>> {
    const allFiles: Array<{ name: string; path: string; content: string }> = [];

    const fetchDir = async (dirPath: string) => {
      const params: Record<string, string> = {};
      if (branch) params.ref = branch;
      const res = await axios.get(
        `${API_BASE}/repos/${owner}/${repo}/contents/${dirPath}`,
        { params, headers: headers(token) }
      );
      const items = res.data;

      for (const item of items) {
        if (item.type === 'file') {
          try {
            const fileRes = await axios.get(item.download_url);
            const content = typeof fileRes.data === 'object'
              ? JSON.stringify(fileRes.data, null, 2)
              : fileRes.data;
            allFiles.push({
              name: item.path,
              path: item.path,
              content,
            });
          } catch (fileErr) {
            console.error(`Failed to fetch ${item.path}:`, fileErr);
          }
        } else if (item.type === 'dir') {
          await fetchDir(item.path);
        }
      }
    };

    await fetchDir('');
    return allFiles;
  },

  /**
   * Pull a repository: fetch latest commit and update files in the workspace.
   * Returns the fetched files so the caller can update the workspace.
   */
  async pullRepo(
    token: string,
    owner: string,
    repo: string,
    branch: string
  ): Promise<Array<{ name: string; path: string; content: string }>> {
    return this.cloneRepo(token, owner, repo, branch);
  },

  // =====================
  // COMPARE
  // =====================

  async compareBranches(
    token: string,
    owner: string,
    repo: string,
    base: string,
    head: string
  ): Promise<CompareResult> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/compare/${base}...${head}`, {
      headers: headers(token),
    });
    return res.data;
  },

  // =====================
  // PULL REQUESTS
  // =====================

  async getPullRequests(
    token: string,
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<PullRequest[]> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/pulls`, {
      params: { state },
      headers: headers(token),
    });
    return res.data;
  },

  async createPullRequest(
    token: string,
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body?: string
  ): Promise<PullRequest> {
    const res = await axios.post(
      `${API_BASE}/repos/${owner}/${repo}/pulls`,
      { title, head, base, body },
      { headers: headers(token) }
    );
    return res.data;
  },

  async mergePullRequest(
    token: string,
    owner: string,
    repo: string,
    number: number
  ): Promise<{ merged: boolean; message: string }> {
    const res = await axios.put(
      `${API_BASE}/repos/${owner}/${repo}/pulls/${number}/merge`,
      {},
      { headers: headers(token) }
    );
    return res.data;
  },

  // =====================
  // ISSUES
  // =====================

  async getIssues(
    token: string,
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<Issue[]> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}/issues`, {
      params: { state },
      headers: headers(token),
    });
    return res.data;
  },

  async createIssue(
    token: string,
    owner: string,
    repo: string,
    title: string,
    body?: string
  ): Promise<Issue> {
    const res = await axios.post(
      `${API_BASE}/repos/${owner}/${repo}/issues`,
      { title, body },
      { headers: headers(token) }
    );
    return res.data;
  },

  // =====================
  // REPO INFO
  // =====================

  async getRepoInfo(token: string, owner: string, repo: string): Promise<RepoInfo> {
    const res = await axios.get(`${API_BASE}/repos/${owner}/${repo}`, {
      headers: headers(token),
    });
    return res.data;
  },
};
