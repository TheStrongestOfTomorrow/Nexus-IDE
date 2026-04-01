import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Github, Plus, Download, GitCommit, ExternalLink, Loader2, RefreshCw, Send, Trash2,
  GitBranch, GitPullRequest, CircleDot, ChevronDown, ChevronRight, Check, X,
  FileText, Clock, User, MessageSquare, Key
} from 'lucide-react';
import { githubService } from '../services/githubService';
import { gitService, Commit, Branch, StagedFileEntry, PullRequest, Issue } from '../services/gitService';

// ============================================================
// Types
// ============================================================

interface GithubViewProps {
  files: any[];
  onImportFiles: (files: { name: string; content: string }[]) => void;
  onClearWorkspace: () => void;
  onUserUpdate: (user: any | null) => void;
  onBranchChange?: (branch: string) => void;
  onRepoChange?: (repo: string | null) => void;
  onUpdateFile?: (id: string, content: string, updateOriginal?: boolean) => Promise<void>;
  activeFileId?: string | null;
}

type TabId = 'source' | 'branches' | 'history' | 'pulls' | 'issues';
type FilterState = 'open' | 'closed' | 'all';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

// ============================================================
// Utility Functions
// ============================================================

function shortSha(sha: string) {
  return sha?.slice(0, 7) ?? '';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getFileStatus(file: any): 'modified' | 'added' | 'untracked' {
  const hasOriginal = file.originalContent !== undefined && file.originalContent !== null && file.originalContent !== '';
  if (!hasOriginal && file.content !== '') return 'added';
  if (hasOriginal && file.content !== file.originalContent) return 'modified';
  return 'untracked';
}

function statusLetter(status: string): string {
  if (status === 'modified' || status === 'M') return 'M';
  if (status === 'added' || status === 'A') return 'A';
  if (status === 'removed' || status === 'D') return 'D';
  if (status === 'untracked' || status === 'U') return 'U';
  return '?';
}

function statusColor(status: string): string {
  if (status === 'modified' || status === 'M') return 'text-amber-400';
  if (status === 'added' || status === 'A') return 'text-emerald-400';
  if (status === 'removed' || status === 'D') return 'text-red-400';
  return 'text-[#858585]';
}

// ============================================================
// Shared Styles
// ============================================================

const S = {
  bg: 'bg-[#252526]',
  bgHover: 'hover:bg-[#2a2d2e]',
  bgActive: 'bg-[#37373d]',
  bgInput: 'bg-[#3c3c3c]',
  text: 'text-[#cccccc]',
  textMuted: 'text-[#858585]',
  textBright: 'text-white',
  border: 'border-[#3c3c3c]',
  borderLight: 'border-[#474747]',
  accent: 'text-[#007acc]',
  accentBg: 'bg-[#007acc]',
  accentBgHover: 'hover:bg-[#0e639c]',
  accentMuted: 'bg-[#007acc]/15 text-[#007acc]',
  greenBtn: 'bg-[#388a34] hover:bg-[#45993f] text-white',
  redBtn: 'bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400',
  badge: 'bg-[#007acc]/20 text-[#007acc]',
  sectionLabel: 'text-[10px] font-semibold text-[#bbbbbb] uppercase tracking-wider',
};

// ============================================================
// Main Component
// ============================================================

export default function GithubView({
  files,
  onImportFiles,
  onClearWorkspace,
  onUserUpdate,
  onBranchChange,
  onRepoChange,
  onUpdateFile: _onUpdateFile,
  activeFileId: _activeFileId,
}: GithubViewProps) {
  // --- Auth ---
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexus_github_token'));
  const [user, setUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Repo / branch ---
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  // --- Staging / commit ---
  const [commitMessage, setCommitMessage] = useState('');
  const [renderTick, setRenderTick] = useState(0);

  // --- Tab state ---
  const [activeTab, setActiveTab] = useState<TabId>('source');

  // --- History ---
  const [commits, setCommits] = useState<Commit[]>([]);
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [commitDetailLoading, setCommitDetailLoading] = useState(false);
  const [commitDetails, setCommitDetails] = useState<Map<string, Commit>>(new Map());
  const [commitPage, setCommitPage] = useState(1);
  const [commitHasMore, setCommitHasMore] = useState(false);

  // --- Pull Requests ---
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [prFilter, setPrFilter] = useState<FilterState>('open');
  const [expandedPR, setExpandedPR] = useState<number | null>(null);
  const [showCreatePR, setShowCreatePR] = useState(false);
  const [newPRTitle, setNewPRTitle] = useState('');
  const [newPRBody, setNewPRBody] = useState('');
  const [newPRHead, setNewPRHead] = useState('');
  const [prLoading, setPrLoading] = useState(false);

  // --- Issues ---
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueFilter, setIssueFilter] = useState<FilterState>('open');
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueBody, setNewIssueBody] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);

  const owner = selectedRepo?.owner?.login;
  const repoName = selectedRepo?.name;

  // ============================================================
  // Staging helpers (via gitService in-memory)
  // ============================================================

  const stagedFiles = useMemo(() => {
    void renderTick;
    return gitService.getStagedFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderTick, files]);

  const stagedPathsSet = useMemo(() => new Set(gitService.getStagedPaths()), [renderTick]);

  const unstagedFiles = useMemo(() => {
    void renderTick;
    return gitService.getUnstagedChanges(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, renderTick]);

  const forceRerender = () => setRenderTick(t => t + 1);

  const handleStageToggle = (path: string, content: string, isStaged: boolean) => {
    if (isStaged) {
      gitService.unstageFile(path);
    } else {
      gitService.stageFile(path, content);
    }
    forceRerender();
  };

  const handleStageAll = () => {
    unstagedFiles.forEach(f => gitService.stageFile(f.path, f.content));
    forceRerender();
  };

  const handleUnstageAll = () => {
    gitService.clearStagingArea();
    forceRerender();
  };

  // ============================================================
  // Auth
  // ============================================================

  const fetchGithubData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const userData = await githubService.getUser(token);
      setUser(userData);
      onUserUpdate(userData);
      const reposData = await githubService.getRepos(token);
      setRepos(reposData);
    } catch {
      setError('Failed to fetch GitHub data');
      setToken(null);
      onUserUpdate(null);
      localStorage.removeItem('nexus_github_token');
    } finally {
      setIsLoading(false);
    }
  }, [token, onUserUpdate]);

  useEffect(() => {
    if (token) fetchGithubData();
  }, [token, fetchGithubData]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const newToken = event.data.token;
        setToken(newToken);
        localStorage.setItem('nexus_github_token', newToken);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    try {
      const url = await githubService.getAuthUrl();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch {
      setError('OAuth not available. Use a Personal Access Token (PAT) below.');
    }
  };

  const [patInput, setPatInput] = useState('');
  const [patError, setPatError] = useState('');

  // Device Flow state
  const [deviceState, setDeviceState] = useState<'idle' | 'pending' | 'polling' | 'success' | 'error'>('idle');
  const [deviceUserCode, setDeviceUserCode] = useState('');
  const [deviceVerificationUri, setDeviceVerificationUri] = useState('');
  const [deviceError, setDeviceError] = useState('');

  const handleConnectPAT = async () => {
    if (!patInput.trim()) return;
    setPatError('');
    try {
      const userData = await githubService.getUser(patInput.trim());
      localStorage.setItem('nexus_github_token', patInput.trim());
      setToken(patInput.trim());
      setUser(userData);
      onUserUpdate(userData);
      const reposData = await githubService.getRepos(patInput.trim());
      setRepos(reposData);
      setPatInput('');
    } catch {
      setPatError('Invalid token. Check your PAT and try again.');
    }
  };

  const handleDeviceFlow = async () => {
    const clientId = localStorage.getItem('nexus_github_client_id') || '';
    if (!clientId) {
      setDeviceError('Set a GitHub OAuth Client ID in Settings → General first.');
      return;
    }
    setDeviceError('');
    setDeviceState('pending');
    try {
      const { userCode, verificationUri, deviceCode, interval } = await githubService.startDeviceFlow(clientId);
      setDeviceUserCode(userCode);
      setDeviceVerificationUri(verificationUri);
      setDeviceState('polling');

      // Open the verification page
      window.open(verificationUri, '_blank');

      // Poll for token
      const poll = async () => {
        try {
          const accessToken = await githubService.pollDeviceToken(clientId, deviceCode);
          localStorage.setItem('nexus_github_token', accessToken);
          setToken(accessToken);
          setDeviceState('success');
          // Fetch user data
          const userData = await githubService.getUser(accessToken);
          setUser(userData);
          onUserUpdate(userData);
          const reposData = await githubService.getRepos(accessToken);
          setRepos(reposData);
        } catch (err: any) {
          if (err.message === 'pending' || err.message === 'slow_down') {
            // Keep polling
            const delay = err.message === 'slow_down' ? (interval + 5) * 1000 : interval * 1000;
            setTimeout(poll, delay);
          } else {
            setDeviceState('error');
            setDeviceError(err.message || 'Device flow failed');
          }
        }
      };
      setTimeout(poll, interval * 1000);
    } catch (err: any) {
      setDeviceState('error');
      setDeviceError(err.message || 'Failed to start device flow');
    }
  };

  const handleDisconnect = () => {
    setToken(null);
    onUserUpdate(null);
    localStorage.removeItem('nexus_github_token');
    setSelectedRepo(null);
    setRepos([]);
    setUser(null);
    gitService.clearStagingArea();
    onBranchChange?.('');
    onRepoChange?.(null);
  };

  // ============================================================
  // Repo data loading
  // ============================================================

  const loadRepoData = useCallback(async () => {
    if (!token || !owner || !repoName) return;
    setIsLoading(true);
    setError(null);
    try {
      const info = await gitService.getRepoInfo(token, owner, repoName);
      setCurrentBranch(info.default_branch);
      setDefaultBranch(info.default_branch);
      onBranchChange?.(info.default_branch);
      onRepoChange?.(`${owner}/${repoName}`);
      const branchList = await gitService.getBranches(token, owner, repoName);
      setBranches(branchList);
    } catch {
      setError('Failed to load repository');
    } finally {
      setIsLoading(false);
    }
  }, [token, owner, repoName, onBranchChange, onRepoChange]);

  useEffect(() => {
    if (selectedRepo) loadRepoData();
    else {
      setBranches([]);
      setCommits([]);
      setExpandedCommit(null);
      setCommitDetails(new Map());
      setPullRequests([]);
      setIssues([]);
    }
  }, [selectedRepo, loadRepoData]);

  // ============================================================
  // Commits (History)
  // ============================================================

  const loadCommits = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!token || !owner || !repoName) return;
    setIsLoading(true);
    try {
      const history = await gitService.getCommitHistory(token, owner, repoName, currentBranch, 15, page);
      setCommitHasMore(history.length === 15);
      setCommits(prev => append ? [...prev, ...history] : history);
      setCommitPage(page);
    } catch {
      console.error('Failed to load commits');
    } finally {
      setIsLoading(false);
    }
  }, [token, owner, repoName, currentBranch]);

  useEffect(() => {
    if (selectedRepo && activeTab === 'history') loadCommits(1);
  }, [selectedRepo, currentBranch, activeTab, loadCommits]);

  const handleToggleCommitDetail = async (sha: string) => {
    if (expandedCommit === sha) {
      setExpandedCommit(null);
      return;
    }
    setExpandedCommit(sha);
    if (commitDetails.has(sha)) return;
    setCommitDetailLoading(true);
    try {
      const detail = await gitService.getSingleCommit(token!, owner!, repoName!, sha);
      setCommitDetails(prev => new Map(prev).set(sha, detail));
    } catch {
      console.error('Failed to load commit detail');
    } finally {
      setCommitDetailLoading(false);
    }
  };

  // ============================================================
  // Commit / Push
  // ============================================================

  const handleCommit = async () => {
    if (!token || !owner || !repoName || !commitMessage.trim()) return;
    const staged = gitService.getStagedFiles();
    if (staged.length === 0) {
      setError('No files staged for commit');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await gitService.commit(token, owner, repoName, currentBranch, commitMessage, staged);
      setCommitMessage('');
      gitService.clearStagingArea();
      forceRerender();
      loadCommits(1);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Commit failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushFiles = async () => {
    if (!token || !owner || !repoName || !commitMessage.trim()) return;
    const staged = gitService.getStagedFiles();
    if (staged.length === 0) {
      setError('No files staged for commit');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await githubService.pushFiles(token, owner, repoName, commitMessage, staged.map(f => ({ path: f.path, content: f.content })));
      setCommitMessage('');
      gitService.clearStagingArea();
      forceRerender();
      loadCommits(1);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Push failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // Pull / Clone / Fetch
  // ============================================================

  const handlePull = async () => {
    if (!token || !owner || !repoName) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedFiles = await gitService.pullRepo(token, owner, repoName, currentBranch);
      onImportFiles(fetchedFiles.map(f => ({ name: f.path, content: f.content })));
      gitService.clearStagingArea();
      forceRerender();
    } catch {
      setError('Pull failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetch = async () => {
    if (!token || !owner || !repoName) return;
    setIsLoading(true);
    setError(null);
    try {
      const branchList = await gitService.getBranches(token, owner, repoName);
      setBranches(branchList);
      await loadCommits(1);
    } catch {
      setError('Fetch failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloneRepo = async (input: string) => {
    if (!token || !input.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const [cloneOwner, cloneRepo] = input.trim().split('/');
      if (!cloneOwner || !cloneRepo) {
        setError('Invalid format. Use owner/repo');
        return;
      }
      const fetchedFiles = await gitService.cloneRepo(token, cloneOwner, cloneRepo);
      onImportFiles(fetchedFiles.map(f => ({ name: f.path, content: f.content })));
      gitService.clearStagingArea();
      forceRerender();
    } catch {
      setError('Failed to clone repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportSelectedRepo = async () => {
    if (!token || !owner || !repoName) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedFiles = await gitService.cloneRepo(token, owner, repoName, currentBranch);
      onImportFiles(fetchedFiles.map(f => ({ name: f.path, content: f.content })));
      gitService.clearStagingArea();
      forceRerender();
    } catch {
      setError('Failed to import repository');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // Branch operations
  // ============================================================

  const handleCreateBranch = async () => {
    if (!token || !owner || !repoName || !newBranchName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await gitService.createBranch(token, owner, repoName, newBranchName.trim(), defaultBranch);
      setNewBranchName('');
      setShowCreateBranch(false);
      const branchList = await gitService.getBranches(token, owner, repoName);
      setBranches(branchList);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create branch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (!token || !owner || !repoName || branchName === defaultBranch) return;
    if (!confirm(`Delete branch "${branchName}"?`)) return;
    setIsLoading(true);
    setError(null);
    try {
      await gitService.deleteBranch(token, owner, repoName, branchName);
      const branchList = await gitService.getBranches(token, owner, repoName);
      setBranches(branchList);
      if (branchName === currentBranch) {
        setCurrentBranch(defaultBranch);
        onBranchChange?.(defaultBranch);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete branch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchBranch = (branchName: string) => {
    setCurrentBranch(branchName);
    onBranchChange?.(branchName);
  };

  // ============================================================
  // Pull Requests
  // ============================================================

  const loadPullRequests = useCallback(async () => {
    if (!token || !owner || !repoName) return;
    setPrLoading(true);
    try {
      const prs = await gitService.getPullRequests(token, owner, repoName, prFilter);
      setPullRequests(prs);
    } catch {
      console.error('Failed to load PRs');
    } finally {
      setPrLoading(false);
    }
  }, [token, owner, repoName, prFilter]);

  useEffect(() => {
    if (selectedRepo && activeTab === 'pulls') loadPullRequests();
  }, [selectedRepo, prFilter, activeTab, loadPullRequests]);

  const handleCreatePR = async () => {
    if (!token || !owner || !repoName || !newPRTitle.trim() || !newPRHead.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await gitService.createPullRequest(token, owner, repoName, newPRTitle.trim(), newPRHead.trim(), defaultBranch, newPRBody.trim() || undefined);
      setNewPRTitle('');
      setNewPRBody('');
      setNewPRHead('');
      setShowCreatePR(false);
      loadPullRequests();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create PR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMergePR = async (number: number) => {
    if (!token || !owner || !repoName) return;
    if (!confirm('Merge this pull request?')) return;
    setIsLoading(true);
    setError(null);
    try {
      await gitService.mergePullRequest(token, owner, repoName, number);
      loadPullRequests();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to merge PR');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // Issues
  // ============================================================

  const loadIssues = useCallback(async () => {
    if (!token || !owner || !repoName) return;
    setIssueLoading(true);
    try {
      const iss = await gitService.getIssues(token, owner, repoName, issueFilter);
      setIssues(iss);
    } catch {
      console.error('Failed to load issues');
    } finally {
      setIssueLoading(false);
    }
  }, [token, owner, repoName, issueFilter]);

  useEffect(() => {
    if (selectedRepo && activeTab === 'issues') loadIssues();
  }, [selectedRepo, issueFilter, activeTab, loadIssues]);

  const handleCreateIssue = async () => {
    if (!token || !owner || !repoName || !newIssueTitle.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await gitService.createIssue(token, owner, repoName, newIssueTitle.trim(), newIssueBody.trim() || undefined);
      setNewIssueTitle('');
      setNewIssueBody('');
      setShowCreateIssue(false);
      loadIssues();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create issue');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // Tab definitions
  // ============================================================

  const tabs: TabDef[] = [
    { id: 'source', label: 'Source', icon: <GitCommit size={13} /> },
    { id: 'branches', label: 'Branches', icon: <GitBranch size={13} /> },
    { id: 'history', label: 'History', icon: <Clock size={13} /> },
    { id: 'pulls', label: 'PRs', icon: <GitPullRequest size={13} /> },
    { id: 'issues', label: 'Issues', icon: <CircleDot size={13} /> },
  ];

  // ============================================================
  // CONNECT SCREEN
  // ============================================================

  if (!token) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center space-y-3 bg-[#252526]">
        <div className="w-16 h-16 bg-[#3c3c3c] rounded-2xl flex items-center justify-center border border-[#474747] shadow-xl mb-2">
          <Github size={32} className="text-[#cccccc]" />
        </div>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Source Control</h2>
        <p className="text-xs text-[#858585] leading-relaxed max-w-[280px]">
          Connect your GitHub account to clone repositories, commit changes, manage branches, and more.
        </p>

        {/* OAuth Device Flow — works on GitHub Pages, no backend needed */}
        {deviceState === 'idle' || deviceState === 'error' ? (
          <button
            onClick={handleDeviceFlow}
            className="w-full max-w-[280px] bg-[#2ea44f] hover:bg-[#2c974b] text-white px-6 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg text-sm"
          >
            <Github size={18} />
            Sign in with GitHub
          </button>
        ) : null}

        {/* Device Flow polling state */}
        {deviceState === 'pending' && (
          <div className="w-full max-w-[280px] space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#2ea44f]" />
              <span className="text-xs text-[#aaa]">Requesting device code...</span>
            </div>
          </div>
        )}

        {deviceState === 'polling' && (
          <div className="w-full max-w-[280px] bg-[#3c3c3c] border border-[#474747] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin text-[#2ea44f]" />
              <span className="text-xs text-[#aaa]">Waiting for authorization...</span>
            </div>
            <div className="bg-[#252526] rounded-lg p-3 border border-[#555]">
              <p className="text-[10px] text-[#888] mb-1">Enter this code on GitHub:</p>
              <p className="text-2xl font-mono font-bold text-[#58a6ff] tracking-[0.3em] text-center">{deviceUserCode}</p>
            </div>
            <a
              href={deviceVerificationUri}
              target="_blank"
              rel="noopener"
              className="block text-center text-xs text-[#58a6ff] hover:underline"
            >
              Open github.com to authorize →
            </a>
          </div>
        )}

        {deviceState === 'success' && (
          <div className="w-full max-w-[280px] bg-[#238636]/20 border border-[#2ea44f]/40 rounded-xl p-3 text-center">
            <p className="text-xs text-[#2ea44f] font-bold">✓ Connected via GitHub OAuth!</p>
          </div>
        )}

        {deviceError && deviceState !== 'success' && (
          <p className="text-[10px] text-red-400 max-w-[280px]">{deviceError}</p>
        )}

        {/* Divider */}
        {deviceState === 'idle' || deviceState === 'error' ? (
          <div className="flex items-center gap-2 w-full max-w-[280px]">
            <div className="flex-1 h-px bg-[#474747]" />
            <span className="text-[10px] text-[#666]">or use PAT</span>
            <div className="flex-1 h-px bg-[#474747]" />
          </div>
        ) : null}

        {/* PAT Input — always works */}
        <div className="w-full max-w-[280px] space-y-2">
          <div className="relative">
            <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858585]" />
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={patInput}
              onChange={(e) => setPatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnectPAT()}
              className="w-full bg-[#3c3c3c] border border-[#474747] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#666] outline-none focus:border-[#007acc] font-mono"
            />
          </div>
          <button
            onClick={handleConnectPAT}
            disabled={!patInput.trim()}
            className="w-full bg-[#30363d] hover:bg-[#3c444d] disabled:opacity-40 disabled:cursor-not-allowed text-[#ccc] px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 border border-[#474747]"
          >
            <Key size={14} />
            Connect with PAT
          </button>
          {patError && <p className="text-[10px] text-red-400">{patError}</p>}
        </div>

        <p className="text-[9px] text-[#555] italic max-w-[260px]">
          Device Flow requires an OAuth Client ID in Settings → General. PAT works instantly.
        </p>
      </div>
    );
  }

  // ============================================================
  // CONNECTED — TAB BAR
  // ============================================================

  const totalChanges = stagedFiles.length + unstagedFiles.length;

  return (
    <div className="flex flex-col h-full bg-[#252526]">
      {/* Header */}
      <div className={`p-2.5 border-b ${S.border} flex items-center gap-2 flex-shrink-0`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <GitBranch size={14} className="text-[#007acc] flex-shrink-0" />
          <span className={`text-[10px] font-bold text-white uppercase tracking-wider`}>SCM</span>
          {totalChanges > 0 && (
            <span className={`${S.badge} text-[9px] px-1.5 py-0.5 rounded-full font-bold`}>
              {totalChanges}
            </span>
          )}
        </div>
        <div className="flex-1" />
        {user && (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[9px] ${S.textMuted} truncate hidden xl:inline`}>
              {user.login}
            </span>
            <img
              src={user.avatar_url}
              alt=""
              className={`w-5 h-5 rounded-full border ${S.border} flex-shrink-0`}
            />
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className={`flex border-b ${S.border} flex-shrink-0 overflow-x-auto`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-[#cccccc] border-[#007acc] bg-[#007acc]/10'
                : `${S.textMuted} border-transparent hover:${S.text}`
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className={`px-3 py-1.5 bg-red-900/20 border-b border-red-500/30 flex items-center gap-2 flex-shrink-0`}>
          <span className="text-[10px] text-red-400 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ============================================================ */}
        {/* SOURCE CONTROL TAB                                            */}
        {/* ============================================================ */}
        {activeTab === 'source' && (
          <div className="flex flex-col">
            {/* Repo selector */}
            {!selectedRepo ? (
              <div className={`p-3 border-b ${S.border} space-y-2`}>
                <span className={S.sectionLabel}>Repository</span>
                <select
                  onChange={e => {
                    const repo = repos.find(r => r.id === Number(e.target.value));
                    if (repo) setSelectedRepo(repo);
                  }}
                  className={`w-full ${S.bgInput} ${S.border} rounded px-2 py-1.5 text-xs outline-none text-[#cccccc] focus:border-[#007acc]`}
                  defaultValue=""
                >
                  <option value="" disabled>Select repository...</option>
                  {repos.map(r => (
                    <option key={r.id} value={r.id}>{r.full_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className={`p-3 border-b ${S.border} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className={S.sectionLabel}>Repository</span>
                  <button onClick={handleFetch} disabled={isLoading} className={S.textMuted} title="Refresh">
                    <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch size={12} className="text-[#007acc] flex-shrink-0" />
                  <span className="text-[11px] text-white font-medium truncate">{owner}/{repoName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch size={11} className={S.textMuted} />
                  <span className={`text-[10px] ${S.textMuted}`}>Branch:</span>
                  <span className={`text-[10px] ${S.accent} font-bold`}>{currentBranch}</span>
                </div>
              </div>
            )}

            {/* Staged files */}
            {stagedFiles.length > 0 && (
              <div className={`border-b ${S.border}`}>
                <div className={`px-3 py-1.5 ${S.bgActive} flex items-center justify-between`}>
                  <span className="text-[10px] font-bold text-[#bbbbbb] uppercase tracking-wider flex items-center gap-1.5">
                    <ChevronDown size={12} className="text-[#007acc]" />
                    Staged Changes ({stagedFiles.length})
                  </span>
                  <button
                    onClick={handleUnstageAll}
                    className={`text-[9px] ${S.textMuted} hover:text-[#cccccc] transition-colors`}
                  >
                    Unstage All
                  </button>
                </div>
                {stagedFiles.map(file => (
                  <div
                    key={`s-${file.path}`}
                    onClick={() => handleStageToggle(file.path, file.content, true)}
                    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer ${S.bgHover} transition-colors group`}
                  >
                    <div className="w-3.5 h-3.5 rounded border border-[#007acc] bg-[#007acc] flex items-center justify-center flex-shrink-0">
                      <Check size={9} className="text-white" />
                    </div>
                    <FileText size={13} className={statusColor(file.status)} />
                    <span className={`text-[11px] text-white truncate flex-1`}>{file.path}</span>
                    <span className={`text-[9px] ${statusColor(file.status)} font-bold flex-shrink-0`}>
                      {statusLetter(file.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Unstaged files */}
            {unstagedFiles.length > 0 && (
              <div className={`border-b ${S.border}`}>
                <div className="px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#bbbbbb] uppercase tracking-wider flex items-center gap-1.5">
                    <ChevronDown size={12} />
                    Changes ({unstagedFiles.length})
                  </span>
                  <button
                    onClick={handleStageAll}
                    className={`text-[9px] ${S.textMuted} hover:text-[#cccccc] transition-colors`}
                  >
                    Stage All
                  </button>
                </div>
                {unstagedFiles.map(file => (
                  <div
                    key={`u-${file.path}`}
                    onClick={() => handleStageToggle(file.path, file.content, false)}
                    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer ${S.bgHover} transition-colors group`}
                  >
                    <div className="w-3.5 h-3.5 rounded border border-[#555] flex-shrink-0" />
                    <FileText size={13} className={statusColor(file.status)} />
                    <span className={`text-[11px] ${S.text} truncate flex-1`}>{file.path}</span>
                    <span className={`text-[9px] ${statusColor(file.status)} font-bold flex-shrink-0`}>
                      {statusLetter(file.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* No changes */}
            {stagedFiles.length === 0 && unstagedFiles.length === 0 && (
              <div className={`px-3 py-6 text-center ${S.textMuted} text-[10px]`}>
                No changes detected in workspace
              </div>
            )}

            {/* Commit message + buttons */}
            <div className={`p-3 border-b ${S.border} space-y-2`}>
              <textarea
                value={commitMessage}
                onChange={e => setCommitMessage(e.target.value)}
                placeholder="Commit message (Ctrl+Enter to commit & push)"
                className={`w-full ${S.bgInput} ${S.border} rounded px-3 py-2 text-xs outline-none text-[#cccccc] focus:border-[#007acc] placeholder:text-[#5a5a5a] resize-none h-14`}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePushFiles();
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCommit}
                  disabled={stagedFiles.length === 0 || !commitMessage.trim() || isLoading}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${S.greenBtn}`}
                >
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Commit
                </button>
                <button
                  onClick={handlePushFiles}
                  disabled={stagedFiles.length === 0 || !commitMessage.trim() || isLoading || !selectedRepo}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${S.accentBg} ${S.accentBgHover} text-white`}
                >
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Commit & Push
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-1.5">
              {selectedRepo && (
                <button
                  onClick={handlePull}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-[11px] font-semibold text-blue-400 transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  Pull Latest
                </button>
              )}
              <button
                onClick={handleImportSelectedRepo}
                disabled={isLoading || !selectedRepo}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#3c3c3c] hover:bg-[#474747] border border-[#474747] rounded text-[11px] font-semibold text-[#cccccc] transition-colors disabled:opacity-40"
              >
                <Download size={12} />
                Import Files from Repo
              </button>
              <button
                onClick={onClearWorkspace}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-colors ${S.redBtn}`}
              >
                <Trash2 size={12} />
                Clear Workspace
              </button>
            </div>

            {/* Disconnect */}
            <div className={`p-3 border-t ${S.border}`}>
              <button
                onClick={handleDisconnect}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] ${S.textMuted} hover:text-[#cccccc] transition-colors`}
              >
                <X size={12} />
                Disconnect GitHub
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* BRANCHES TAB                                                   */}
        {/* ============================================================ */}
        {activeTab === 'branches' && (
          <div className="flex flex-col">
            {/* Repo selector for this tab */}
            <div className={`p-3 border-b ${S.border} space-y-2`}>
              <span className={S.sectionLabel}>Repository</span>
              <select
                value={selectedRepo?.id || ''}
                onChange={e => {
                  const repo = repos.find(r => r.id === Number(e.target.value));
                  setSelectedRepo(repo || null);
                }}
                className={`w-full ${S.bgInput} ${S.border} rounded px-2 py-1.5 text-xs outline-none text-[#cccccc] focus:border-[#007acc]`}
              >
                <option value="">Select repository...</option>
                {repos.map(r => (
                  <option key={r.id} value={r.id}>{r.full_name}</option>
                ))}
              </select>
            </div>

            {selectedRepo && (
              <>
                {/* Current branch indicator */}
                <div className={`px-3 py-2 ${S.bgActive} flex items-center gap-2`}>
                  <GitBranch size={13} className="text-[#007acc]" />
                  <span className="text-[10px] font-bold text-white">{currentBranch}</span>
                  <span className={`${S.badge} text-[8px] px-1.5 py-0.5 rounded-full font-bold`}>
                    active
                  </span>
                  <div className="flex-1" />
                  <button onClick={handleFetch} disabled={isLoading} title="Refresh">
                    <RefreshCw size={12} className={`${S.textMuted} ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Branch list */}
                <div className="max-h-[400px] overflow-y-auto">
                  {branches.length === 0 ? (
                    <div className={`px-3 py-6 text-center ${S.textMuted} text-[10px]`}>
                      {isLoading ? (
                        <Loader2 size={18} className="animate-spin text-[#007acc] mx-auto" />
                      ) : (
                        'No branches found'
                      )}
                    </div>
                  ) : (
                    branches.map(branch => {
                      const isActive = branch.name === currentBranch;
                      const isDefault = branch.name === defaultBranch;
                      return (
                        <div
                          key={branch.name}
                          className={`flex items-center gap-2 px-3 py-2 transition-colors group ${
                            isActive ? 'bg-[#007acc]/10' : S.bgHover
                          }`}
                        >
                          <GitBranch size={13} className={isActive ? 'text-[#007acc]' : S.textMuted} />
                          <button
                            onClick={() => handleSwitchBranch(branch.name)}
                            className={`text-[11px] flex-1 text-left truncate transition-colors ${
                              isActive ? 'text-white font-semibold' : `${S.textMuted} hover:text-[#cccccc]`
                            }`}
                          >
                            {branch.name}
                          </button>
                          {isDefault && (
                            <span className="text-[8px] bg-[#3c3c3c] text-[#858585] px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                              default
                            </span>
                          )}
                          {!isActive && !isDefault && (
                            <button
                              onClick={() => handleDeleteBranch(branch.name)}
                              className={`${S.textMuted} hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0`}
                              title="Delete branch"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Create branch */}
                {showCreateBranch ? (
                  <div className={`p-3 border-t ${S.border} space-y-2`}>
                    <input
                      autoFocus
                      type="text"
                      value={newBranchName}
                      onChange={e => setNewBranchName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateBranch()}
                      placeholder="New branch name..."
                      className={`w-full ${S.bgInput} ${S.border} rounded px-2.5 py-1.5 text-xs outline-none text-[#cccccc] focus:border-[#007acc] placeholder:text-[#5a5a5a]`}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setShowCreateBranch(false); setNewBranchName(''); }}
                        className={`text-[10px] ${S.textMuted} hover:text-[#cccccc]`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateBranch}
                        disabled={!newBranchName.trim() || isLoading}
                        className={`text-[10px] ${S.accentBg} ${S.accentBgHover} text-white px-3 py-1 rounded font-bold disabled:opacity-40`}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`px-3 py-2 border-t ${S.border}`}>
                    <button
                      onClick={() => setShowCreateBranch(true)}
                      className={`text-[10px] flex items-center gap-1 ${S.textMuted} hover:text-[#cccccc] transition-colors`}
                    >
                      <Plus size={10} />
                      New Branch
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* HISTORY TAB                                                    */}
        {/* ============================================================ */}
        {activeTab === 'history' && (
          <div className="flex flex-col">
            {!selectedRepo ? (
              <div className={`px-3 py-3 border-b ${S.border} space-y-2`}>
                <span className={S.sectionLabel}>Repository</span>
                <select
                  onChange={e => {
                    const repo = repos.find(r => r.id === Number(e.target.value));
                    if (repo) setSelectedRepo(repo);
                  }}
                  className={`w-full ${S.bgInput} ${S.border} rounded px-2 py-1.5 text-xs outline-none text-[#cccccc] focus:border-[#007acc]`}
                  defaultValue=""
                >
                  <option value="" disabled>Select repository...</option>
                  {repos.map(r => (
                    <option key={r.id} value={r.id}>{r.full_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className={`px-3 py-2 ${S.bgActive} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <GitCommit size={13} className="text-[#007acc]" />
                    <span className="text-[10px] font-bold text-white">{currentBranch}</span>
                  </div>
                  <button onClick={() => loadCommits(1)} disabled={isLoading} title="Refresh">
                    <RefreshCw size={12} className={`${S.textMuted} ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {isLoading && commits.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-[#007acc]" />
                  </div>
                ) : commits.length === 0 ? (
                  <div className={`px-3 py-8 text-center ${S.textMuted} text-[10px]`}>No commits yet</div>
                ) : (
                  <div>
                    {commits.map(commit => {
                      const isExpanded = expandedCommit === commit.sha;
                      const detail = commitDetails.get(commit.sha);
                      return (
                        <div key={commit.sha} className={`border-b ${S.borderLight}`}>
                          <div
                            onClick={() => handleToggleCommitDetail(commit.sha)}
                            className={`flex items-start gap-2 px-3 py-2 cursor-pointer ${S.bgHover} transition-colors`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              <img
                                src={commit.author?.avatar_url || ''}
                                alt=""
                                className="w-4 h-4 rounded-full"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-white truncate flex-1">
                                  {commit.commit.message.split('\n')[0]}
                                </span>
                                <span className="text-[9px] text-[#007acc] font-mono flex-shrink-0">
                                  {shortSha(commit.sha)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[9px] ${S.textMuted}`}>
                                  {commit.author?.login || commit.commit.author.name}
                                </span>
                                <span className={`text-[9px] ${S.textMuted}`}>•</span>
                                <span className={`text-[9px] ${S.textMuted}`}>
                                  {timeAgo(commit.commit.author.date)}
                                </span>
                              </div>
                            </div>
                            <ChevronRight
                              size={12}
                              className={`${S.textMuted} flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </div>

                          {isExpanded && (
                            <div className={`${S.bg} border-t ${S.borderLight}`}>
                              {commitDetailLoading ? (
                                <div className="flex justify-center py-3">
                                  <Loader2 size={14} className="animate-spin text-[#007acc]" />
                                </div>
                              ) : (
                                <>
                                  <div className={`px-3 py-1.5 text-[10px] ${S.textMuted}`}>
                                    {commit.commit.message}
                                  </div>
                                  {detail?.stats && (
                                    <div className={`px-3 py-1 flex items-center gap-2`}>
                                      <span className={`text-[9px] ${S.textMuted}`}>
                                        {detail.stats.total} files
                                      </span>
                                      <span className="text-[9px] text-emerald-400">
                                        +{detail.stats.additions}
                                      </span>
                                      <span className="text-[9px] text-red-400">
                                        -{detail.stats.deletions}
                                      </span>
                                    </div>
                                  )}
                                  {detail?.files && detail.files.length > 0 && (
                                    <div className="max-h-48 overflow-y-auto">
                                      {detail.files.map((file, idx) => (
                                        <div key={idx} className={`border-t ${S.borderLight}`}>
                                          <div className="flex items-center gap-2 px-3 py-1">
                                            <FileText size={11} className={statusColor(file.status)} />
                                            <span className="text-[10px] text-white truncate flex-1">{file.filename}</span>
                                            <span className="text-[9px] text-emerald-400">+{file.additions}</span>
                                            <span className="text-[9px] text-red-400">-{file.deletions}</span>
                                          </div>
                                          {file.patch && (
                                            <pre className="text-[8px] font-mono p-2 overflow-x-auto bg-[#1e1e1e] text-[#858585] leading-relaxed max-h-24 whitespace-pre-wrap break-all">
                                              {file.patch}
                                            </pre>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="px-3 py-1.5">
                                    <button
                                      onClick={() => handleToggleCommitDetail(commit.sha)}
                                      className={`text-[9px] flex items-center gap-1 ${S.accent} hover:underline`}
                                    >
                                      <ExternalLink size={9} />
                                      View diff
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {commitHasMore && (
                      <div className="px-3 py-2">
                        <button
                          onClick={() => loadCommits(commitPage + 1, true)}
                          disabled={isLoading}
                          className={`w-full text-[10px] flex items-center justify-center gap-1 ${S.accent} hover:underline disabled:opacity-40`}
                        >
                          {isLoading ? <Loader2 size={11} className="animate-spin" /> : <ChevronDown size={11} />}
                          Load More Commits
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* PULL REQUESTS TAB                                              */}
        {/* ============================================================ */}
        {activeTab === 'pulls' && (
          <div className="flex flex-col">
            {!selectedRepo ? (
              <div className={`px-3 py-3 border-b ${S.border} space-y-2`}>
                <span className={S.sectionLabel}>Repository</span>
                <select
                  onChange={e => {
                    const repo = repos.find(r => r.id === Number(e.target.value));
                    if (repo) setSelectedRepo(repo);
                  }}
                  className={`w-full ${S.bgInput} ${S.border} rounded px-2 py-1.5 text-xs outline-none text-[#cccccc] focus:border-[#007acc]`}
                  defaultValue=""
                >
                  <option value="" disabled>Select repository...</option>
                  {repos.map(r => (
                    <option key={r.id} value={r.id}>{r.full_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                {/* PR filter tabs */}
                <div className={`flex border-b ${S.border}`}>
                  {(['open', 'closed', 'all'] as FilterState[]).map(state => (
                    <button
                      key={state}
                      onClick={() => setPrFilter(state)}
                      className={`flex-1 px-2 py-1.5 text-[10px] font-semibold capitalize transition-colors border-b-2 ${
                        prFilter === state
                          ? 'text-[#cccccc] border-[#007acc] bg-[#007acc]/10'
                          : `${S.textMuted} border-transparent hover:${S.text}`
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>

                {/* Create PR button */}
                <div className={`px-3 py-2 border-b ${S.border}`}>
                  <button
                    onClick={() => setShowCreatePR(true)}
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold transition-colors ${S.accentBg} ${S.accentBgHover} text-white`}
                  >
                    <Plus size={11} />
                    Create Pull Request
                  </button>
                </div>

                {/* Create PR form */}
                {showCreatePR && (
                  <div className={`p-3 border-b ${S.border} space-y-2`}>
                    <input
                      autoFocus
                      type="text"
                      value={newPRTitle}
                      onChange={e => setNewPRTitle(e.target.value)}
                      placeholder="PR title..."
                      className={`w-full ${S.bgInput} ${S.border} rounded px-2.5 py-1.5 text-xs outline-none text-[#cccccc] focus:border-[#007acc] placeholder:text-[#5a5a5a]`}
                    />
                    <input
                      type="text"
                      value={newPRHead}
                      onChange={e => setNewPRHead(e.target.value)}
                      placeholder="Head branch (e.g. feature-branch)"
                      className={`w-full ${S.bgInput} ${S.border} rounded px-2.5 py-1.5 text-xs outline-none text-[#cccccc] focus:border-[#007acc] placeholder:text-[#5a5a5a]`}
                    />
                    <textarea
                      value={newPRBody}
                      onChange={e => setNewPRBody(e.target.value)}
                      placeholder="Description (optional)..."
                      className={`w-full ${S.bgInput} ${S.border} rounded px-2.5 py-1.5 text-xs outline-none text-[#cccccc] focus:border-[#007acc] placeholder:text-[#5a5a5a] resize-none h-14`}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setShowCreatePR(false); setNewPRTitle(''); setNewPRBody(''); setNewPRHead(''); }}
                        className={`text-[10px] ${S.textMuted} hover:text-[#cccccc]`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreatePR}
                        disabled={!newPRTitle.trim() || !newPRHead.trim() || isLoading}
                        className={`text-[10px] ${S.accentBg} ${S.accentBgHover} text-white px-3 py-1 rounded font-bold disabled:opacity-40`}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}

                {/* PR list */}
                {prLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-[#007acc]" />
                  </div>
                ) : pullRequests.length === 0 ? (
                  <div className={`px-3 py-8 text-center ${S.textMuted} text-[10px]`}>
                    No pull requests found
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    {pullRequests.map(pr => {
                      const isExpanded = expandedPR === pr.number;
                      const isOpen = pr.state === 'open';
                      return (
                        <div key={pr.number} className={`border-b ${S.borderLight}`}>
                          <div
                            onClick={() => setExpandedPR(isExpanded ? null : pr.number)}
                            className={`flex items-start gap-2 px-3 py-2 cursor-pointer ${S.bgHover} transition-colors`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              <img
                                src={pr.user?.avatar_url || ''}
                                alt=""
                                className="w-4 h-4 rounded-full"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] ${S.accent} font-mono`}>#{pr.number}</span>
                                <span className="text-[11px] text-white truncate flex-1">{pr.title}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                                    isOpen
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-purple-500/20 text-purple-400'
                                  }`}
                                >
                                  {pr.state}
                                </span>
                                <span className={`text-[9px] ${S.textMuted}`}>
                                  {pr.user?.login}
                                </span>
                                <span className={`text-[9px] ${S.textMuted}`}>•</span>
                                <span className={`text-[9px] ${S.textMuted}`}>
                                  {timeAgo(pr.created_at)}
                                </span>
                              </div>
                            </div>
                            <ChevronRight
                              size={12}
                              className={`${S.textMuted} flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </div>

                          {isExpanded && (
                            <div className={`${S.bg} border-t ${S.borderLight} p-3 space-y-2`}>
                              {pr.body && (
                                <p className={`text-[10px] ${S.textMuted} whitespace-pre-wrap`}>
                                  {pr.body}
                                </p>
                              )}
                              <div className={`flex items-center gap-2 text-[9px] ${S.textMuted}`}>
                                <span>
                                  {pr.head.ref} → {pr.base.ref}
                                </span>
                              </div>
                              {isOpen && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleMergePR(pr.number); }}
                                  disabled={isLoading}
                                  className={`flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold transition-colors ${S.greenBtn} disabled:opacity-40`}
                                >
                                  <GitPullRequest size={10} />
                                  Merge Pull Request
                                </button>
                              )}
                              <a
                                href={pr.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[9px] flex items-center gap-1 ${S.accent} hover:underline`}
                              >
                                <ExternalLink size={9} />
                                Open on GitHub
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ISSUES TAB                                                     */}
        {/* ============================================================ */}
        {activeTab === 'issues' && (
          <div className="flex flex-col">
            {!selectedRepo ? (
              <div className={`px-3 py-3 border-b ${S.border} space-y-2`}>
                <span className={S.sectionLabel}>Repository</span>
                <select
                  onChange={e => {
                    const repo = repos.find(r => r.id === Number(e.target.value));
                    if (repo) setSelectedRepo(repo);
                  }}
                  className={`w-full ${S.bgInput} ${S.border} rounded px-2 py-1.5 text-xs outline-none text-[#cccccc] focus:border-[#007acc]`}
                  defaultValue=""
                >
                  <option value="" disabled>Select repository...</option>
                  {repos.map(r => (
                    <option key={r.id} value={r.id}>{r.full_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                {/* Issue filter tabs */}
                <div className={`flex border-b ${S.border}`}>
                  {(['open', 'closed', 'all'] as FilterState[]).map(state => (
                    <button
                      key={state}
                      onClick={() => setIssueFilter(state)}
                      className={`flex-1 px-2 py-1.5 text-[10px] font-semibold capitalize transition-colors border-b-2 ${
                        issueFilter === state
                          ? 'text-[#cccccc] border-[#007acc] bg-[#007acc]/10'
                          : `${S.textMuted} border-transparent hover:${S.text}`
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>

                {/* Create Issue button */}
                <div className={`px-3 py-2 border-b ${S.border}`}>
                  <button
                    onClick={() => setShowCreateIssue(true)}
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold transition-colors ${S.accentBg} ${S.accentBgHover} text-white`}
                  >
                    <Plus size={11} />
                    Create Issue
                  </button>
                </div>

                {/* Create Issue form */}
                {showCreateIssue && (
                  <div className={`p-3 border-b ${S.border} space-y-2`}>
                    <input
                      autoFocus
                      type="text"
                      value={newIssueTitle}
                      onChange={e => setNewIssueTitle(e.target.value)}
                      placeholder="Issue title..."
                      className={`w-full ${S.bgInput} ${S.border} rounded px-2.5 py-1.5 text-xs outline-none text-[#cccccc] focus:border-[#007acc] placeholder:text-[#5a5a5a]`}
                    />
                    <textarea
                      value={newIssueBody}
                      onChange={e => setNewIssueBody(e.target.value)}
                      placeholder="Description (optional)..."
                      className={`w-full ${S.bgInput} ${S.border} rounded px-2.5 py-1.5 text-xs outline-none text-[#cccccc] focus:border-[#007acc] placeholder:text-[#5a5a5a] resize-none h-14`}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setShowCreateIssue(false); setNewIssueTitle(''); setNewIssueBody(''); }}
                        className={`text-[10px] ${S.textMuted} hover:text-[#cccccc]`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateIssue}
                        disabled={!newIssueTitle.trim() || isLoading}
                        className={`text-[10px] ${S.accentBg} ${S.accentBgHover} text-white px-3 py-1 rounded font-bold disabled:opacity-40`}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}

                {/* Issue list */}
                {issueLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-[#007acc]" />
                  </div>
                ) : issues.length === 0 ? (
                  <div className={`px-3 py-8 text-center ${S.textMuted} text-[10px]`}>
                    No issues found
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    {issues.map(issue => {
                      const isExpanded = expandedIssue === issue.number;
                      const isOpen = issue.state === 'open';
                      return (
                        <div key={issue.number} className={`border-b ${S.borderLight}`}>
                          <div
                            onClick={() => setExpandedIssue(isExpanded ? null : issue.number)}
                            className={`flex items-start gap-2 px-3 py-2 cursor-pointer ${S.bgHover} transition-colors`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {isOpen ? (
                                <CircleDot size={13} className="text-emerald-400" />
                              ) : (
                                <Check size={13} className="text-purple-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] ${S.accent} font-mono`}>#{issue.number}</span>
                                <span className="text-[11px] text-white truncate flex-1">{issue.title}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {issue.labels.map(label => (
                                  <span
                                    key={label.name}
                                    className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                                    style={{
                                      backgroundColor: `${label.color}33`,
                                      color: label.color,
                                      border: `1px solid ${label.color}55`,
                                    }}
                                  >
                                    {label.name}
                                  </span>
                                ))}
                                <span className={`text-[9px] ${S.textMuted}`}>
                                  {issue.user?.login}
                                </span>
                                <span className={`text-[9px] ${S.textMuted}`}>•</span>
                                <span className={`text-[9px] ${S.textMuted}`}>
                                  {timeAgo(issue.created_at)}
                                </span>
                              </div>
                            </div>
                            <ChevronRight
                              size={12}
                              className={`${S.textMuted} flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </div>

                          {isExpanded && (
                            <div className={`${S.bg} border-t ${S.borderLight} p-3 space-y-2`}>
                              {issue.body ? (
                                <p className={`text-[10px] ${S.textMuted} whitespace-pre-wrap`}>
                                  {issue.body}
                                </p>
                              ) : (
                                <p className={`text-[10px] ${S.textMuted} italic`}>No description provided</p>
                              )}
                              <a
                                href={issue.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[9px] flex items-center gap-1 ${S.accent} hover:underline`}
                              >
                                <ExternalLink size={9} />
                                Open on GitHub
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
