import React, { useState, useEffect } from 'react';
import { Github, Plus, Download, GitCommit, ExternalLink, Loader2, RefreshCw, Send, Trash2 } from 'lucide-react';
import { githubService } from '../services/githubService';
import { cn } from '../lib/utils';

interface GithubViewProps {
  files: any[];
  onImportFiles: (files: { name: string, content: string }[]) => void;
  onClearWorkspace: () => void;
  onUserUpdate: (user: any | null) => void;
}

export default function GithubView({ files, onImportFiles, onClearWorkspace, onUserUpdate }: GithubViewProps) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexus_github_token'));
  const [user, setUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isPushing, setIsPushing] = useState<string | null>(null);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('Created via Nexus IDE');
  const [newRepoLicense, setNewRepoLicense] = useState('mit');
  const [isPrivate, setIsPrivate] = useState(false);
  const [commitMessage, setCommitMessage] = useState('Update from Nexus IDE');

  useEffect(() => {
    if (token) {
      fetchGithubData();
    }
  }, [token]);

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

  const fetchGithubData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const userData = await githubService.getUser(token);
      setUser(userData);
      onUserUpdate(userData);
      const reposData = await githubService.getRepos(token);
      setRepos(reposData);
    } catch (error) {
      console.error('Failed to fetch Github data', error);
      // If 401, clear token
      setToken(null);
      onUserUpdate(null);
      localStorage.removeItem('nexus_github_token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const url = await githubService.getAuthUrl();
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (error) {
      alert('Failed to get auth URL');
    }
  };

  const handleImportRepo = async (owner: string, repo: string) => {
    setIsLoading(true);
    try {
      const files = await githubService.fetchAllFiles(token!, owner, repo);
      onImportFiles(files);
      alert(`Imported ${files.length} files from ${repo}`);
    } catch (error) {
      console.error('Failed to import repo', error);
      alert('Failed to import repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;
    setIsLoading(true);
    try {
      await githubService.createRepo(token!, newRepoName, newRepoDesc, isPrivate, newRepoLicense);
      setNewRepoName('');
      setNewRepoDesc('Created via Nexus IDE');
      setIsCreating(false);
      fetchGithubData();
      alert('Repository created successfully!');
    } catch (error) {
      alert('Failed to create repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async (owner: string, repo: string) => {
    if (!commitMessage.trim()) return;
    setIsPushing(repo);
    try {
      const filesToPush = files.map(f => ({
        path: f.name,
        content: f.content
      }));
      await githubService.pushFiles(token!, owner, repo, commitMessage, filesToPush);
      alert('Changes pushed successfully!');
    } catch (error) {
      console.error('Push failed', error);
      alert('Failed to push changes');
    } finally {
      setIsPushing(null);
    }
  };

  if (!token) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center space-y-4">
        <Github size={48} className="text-gray-500 mb-2" />
        <h2 className="text-lg font-semibold text-white">GitHub Integration</h2>
        <p className="text-sm text-gray-400">
          Connect your GitHub account to clone repositories, commit changes, and create new projects.
        </p>
        <button
          onClick={handleConnect}
          className="bg-[#2ea44f] hover:bg-[#2c974b] text-white px-6 py-2 rounded-md font-bold transition-colors flex items-center gap-2"
        >
          <Github size={18} />
          Connect GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#252526]">
      <div className="p-4 border-b border-[#333] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {user && (
            <img src={user.avatar_url} alt={user.login} className="w-6 h-6 rounded-full" />
          )}
          <span className="text-sm font-bold text-white uppercase tracking-wider">GitHub</span>
        </div>
        <button 
          onClick={fetchGithubData}
          className="p-1 hover:bg-[#333] rounded text-gray-400"
          disabled={isLoading}
        >
          <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#3c3c3c] hover:bg-[#444] rounded text-sm text-white transition-colors"
            >
              <Plus size={16} />
              New Repo
            </button>
            <button
              onClick={onClearWorkspace}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 rounded text-sm text-red-400 border border-red-500/30 transition-colors"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
          
          {isCreating && (
            <form onSubmit={handleCreateRepo} className="p-3 bg-[#1e1e1e] rounded border border-[#333] space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Repository name"
                value={newRepoName}
                onChange={e => setNewRepoName(e.target.value)}
                className="w-full bg-[#2d2d2d] border border-[#444] rounded px-2 py-1.5 text-xs outline-none text-white focus:border-blue-500"
              />
              <textarea
                placeholder="Description"
                value={newRepoDesc}
                onChange={e => setNewRepoDesc(e.target.value)}
                className="w-full bg-[#2d2d2d] border border-[#444] rounded px-2 py-1.5 text-xs outline-none text-white focus:border-blue-500 h-16 resize-none"
              />
              <div className="flex gap-2">
                <select
                  value={newRepoLicense}
                  onChange={e => setNewRepoLicense(e.target.value)}
                  className="flex-1 bg-[#2d2d2d] border border-[#444] rounded px-2 py-1.5 text-xs outline-none text-white focus:border-blue-500"
                >
                  <option value="mit">MIT License</option>
                  <option value="apache-2.0">Apache 2.0</option>
                  <option value="gpl-3.0">GPL 3.0</option>
                  <option value="unlicense">Unlicense</option>
                </select>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPrivate} 
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="rounded border-[#444] bg-[#2d2d2d]"
                  />
                  Private
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Repositories */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Repositories</h3>
          {isLoading && repos.length === 0 ? (
            <div className="flex justify-center py-4">
              <Loader2 size={24} className="animate-spin text-gray-600" />
            </div>
          ) : (
            <div className="space-y-1">
              {repos.map(repo => (
                <div key={repo.id} className="group p-2 hover:bg-[#2a2d2e] rounded border border-transparent hover:border-[#3c3c3c] transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-400 truncate flex-1">{repo.name}</span>
                    <a href={repo.html_url} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleImportRepo(repo.owner.login, repo.name)}
                      className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                    >
                      <Download size={10} />
                      Import
                    </button>
                    <button
                      onClick={() => handlePush(repo.owner.login, repo.name)}
                      disabled={isPushing === repo.name}
                      className="text-[10px] bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-900/50 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {isPushing === repo.name ? <Loader2 size={10} className="animate-spin" /> : <GitCommit size={10} />}
                      Push
                    </button>
                    <span className="text-[10px] text-gray-500">{repo.private ? 'Private' : 'Public'}</span>
                  </div>
                  {isPushing === repo.name && (
                    <div className="mt-2">
                      <input 
                        type="text"
                        value={commitMessage}
                        onChange={e => setCommitMessage(e.target.value)}
                        placeholder="Commit message"
                        className="w-full bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 text-[10px] outline-none text-white focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-[#333]">
        <button
          onClick={() => {
            setToken(null);
            onUserUpdate(null);
            localStorage.removeItem('nexus_github_token');
          }}
          className="w-full text-xs text-gray-500 hover:text-red-400 transition-colors text-center"
        >
          Disconnect GitHub
        </button>
      </div>
    </div>
  );
}
