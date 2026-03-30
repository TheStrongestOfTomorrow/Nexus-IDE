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
      <div className="p-6 flex flex-col items-center justify-center h-full text-center space-y-4 bg-nexus-sidebar">
        <div className="w-16 h-16 bg-nexus-bg rounded-2xl flex items-center justify-center border border-nexus-border shadow-xl mb-4">
          <Github size={32} className="text-nexus-text" />
        </div>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">GitHub Integration</h2>
        <p className="text-xs text-nexus-text-muted leading-relaxed">
          Connect your GitHub account to clone repositories, commit changes, and collaborate on projects.
        </p>
        <button
          onClick={handleConnect}
          className="bg-[#2ea44f] hover:bg-[#2c974b] text-white px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
        >
          <Github size={18} />
          Connect GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border flex items-center justify-between bg-nexus-sidebar">
        <div className="flex items-center gap-2">
          {user && (
            <img src={user.avatar_url} alt={user.login} className="w-6 h-6 rounded-full border border-nexus-border" />
          )}
          <span className="text-xs font-bold text-white uppercase tracking-wider">GitHub</span>
        </div>
        <button 
          onClick={fetchGithubData}
          className="p-1 hover:bg-nexus-bg rounded text-nexus-text-muted transition-colors"
          disabled={isLoading}
        >
          <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-nexus-sidebar">
        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-bg hover:bg-nexus-bg/80 rounded-lg text-xs font-bold text-white transition-colors border border-nexus-border"
            >
              <Plus size={14} />
              NEW REPO
            </button>
            <button
              onClick={onClearWorkspace}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/30 rounded-lg text-xs font-bold text-red-400 border border-red-500/30 transition-colors"
            >
              <Trash2 size={14} />
              CLEAR
            </button>
          </div>
          
          {isCreating && (
            <form onSubmit={handleCreateRepo} className="p-3 bg-nexus-bg rounded-xl border border-nexus-border space-y-3 shadow-xl">
              <input
                autoFocus
                type="text"
                placeholder="Repository name"
                value={newRepoName}
                onChange={e => setNewRepoName(e.target.value)}
                className="w-full bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-2 text-xs outline-none text-white focus:border-nexus-accent"
              />
              <textarea
                placeholder="Description"
                value={newRepoDesc}
                onChange={e => setNewRepoDesc(e.target.value)}
                className="w-full bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-2 text-xs outline-none text-white focus:border-nexus-accent h-16 resize-none"
              />
              <div className="flex gap-2">
                <select
                  value={newRepoLicense}
                  onChange={e => setNewRepoLicense(e.target.value)}
                  className="flex-1 bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-2 text-xs outline-none text-white focus:border-nexus-accent"
                >
                  <option value="mit">MIT License</option>
                  <option value="apache-2.0">Apache 2.0</option>
                  <option value="gpl-3.0">GPL 3.0</option>
                  <option value="unlicense">Unlicense</option>
                </select>
                <label className="flex items-center gap-2 text-[10px] text-nexus-text-muted cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isPrivate} 
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="rounded border-nexus-border bg-nexus-sidebar text-nexus-accent"
                  />
                  PRIVATE
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-nexus-text-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-nexus-accent hover:bg-nexus-accent/80 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-nexus-accent/20"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Repositories */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">Your Repositories</h3>
          {isLoading && repos.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-nexus-accent" />
            </div>
          ) : (
            <div className="space-y-2">
              {repos.map(repo => (
                <div key={repo.id} className="group p-3 bg-nexus-bg hover:bg-nexus-bg/80 rounded-xl border border-nexus-border hover:border-nexus-accent/30 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white truncate flex-1">{repo.name}</span>
                    <a href={repo.html_url} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 text-nexus-text-muted hover:text-white transition-opacity">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleImportRepo(repo.owner.login, repo.name)}
                      className="text-[10px] bg-nexus-accent/10 text-nexus-accent px-2 py-1 rounded-lg border border-nexus-accent/20 hover:bg-nexus-accent/20 transition-colors flex items-center gap-1 font-bold"
                    >
                      <Download size={10} />
                      IMPORT
                    </button>
                    <button
                      onClick={() => handlePush(repo.owner.login, repo.name)}
                      disabled={isPushing === repo.name}
                      className="text-[10px] bg-emerald-900/20 text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/20 hover:bg-emerald-900/30 transition-colors flex items-center gap-1 font-bold disabled:opacity-50"
                    >
                      {isPushing === repo.name ? <Loader2 size={10} className="animate-spin" /> : <GitCommit size={10} />}
                      PUSH
                    </button>
                    <span className="text-[9px] text-nexus-text-muted font-bold uppercase ml-auto">{repo.private ? 'Private' : 'Public'}</span>
                  </div>
                  {isPushing === repo.name && (
                    <div className="mt-3">
                      <input 
                        type="text"
                        value={commitMessage}
                        onChange={e => setCommitMessage(e.target.value)}
                        placeholder="Commit message"
                        className="w-full bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-1.5 text-[10px] outline-none text-white focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-nexus-border">
        <button
          onClick={() => {
            setToken(null);
            onUserUpdate(null);
            localStorage.removeItem('nexus_github_token');
          }}
          className="w-full text-[10px] font-bold text-nexus-text-muted hover:text-red-400 transition-colors text-center uppercase tracking-widest"
        >
          Disconnect GitHub
        </button>
      </div>
    </div>
  );
}
