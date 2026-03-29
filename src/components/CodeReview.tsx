import React, { useState, useEffect, useCallback } from 'react';
import { GitPullRequest, ExternalLink, ChevronDown, ChevronRight, MessageSquare, FileDiff, RefreshCw, Loader2, Settings, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface CodeReviewProps {
  githubToken?: string;
}

interface GithubPR {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  merged_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
  };
  created_at: string;
  updated_at: string;
  changed_files: number;
  additions: number;
  deletions: number;
  html_url: string;
  draft: boolean;
}

const API_URL = 'https://api.github.com/repos/TheStrongestOfTomorrow/Nexus-IDE/pulls?state=all&per_page=20';

export default function CodeReview({ githubToken }: CodeReviewProps) {
  const [prs, setPrs] = useState<GithubPR[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchPRs = useCallback(async () => {
    if (!githubToken) {
      setPrs([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setPrs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pull requests');
    } finally {
      setLoading(false);
    }
  }, [githubToken]);

  useEffect(() => {
    fetchPRs();
  }, [fetchPRs]);

  const getPRStatus = (pr: GithubPR): 'Open' | 'Merged' | 'Closed' => {
    if (pr.state === 'open') return 'Open';
    if (pr.merged_at) return 'Merged';
    return 'Closed';
  };

  const statusColors: Record<string, string> = {
    Open: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Merged: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    Closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const formatRelativeTime = (dateStr: string): string => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const openCount = prs.filter(pr => pr.state === 'open').length;
  const mergedCount = prs.filter(pr => pr.merged_at).length;
  const closedCount = prs.filter(pr => pr.state === 'closed' && !pr.merged_at).length;

  // No token view
  if (!githubToken) {
    return (
      <div className="flex flex-col h-full bg-nexus-sidebar">
        <div className="p-4 border-b border-nexus-border">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
            <GitPullRequest size={16} className="text-nexus-accent" />
            Code Review
          </h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-16 h-16 bg-nexus-bg rounded-2xl flex items-center justify-center border border-nexus-border shadow-xl">
            <Settings size={32} className="text-nexus-text-muted" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-white">Connect Your GitHub Account</p>
            <p className="text-[10px] text-nexus-text-muted leading-relaxed max-w-[200px]">
              Connect your GitHub account in Settings to view real pull requests from your repository.
            </p>
          </div>
        </div>
        <div className="p-3 border-t border-nexus-border bg-nexus-bg">
          <p className="text-[9px] text-nexus-text-muted text-center font-bold uppercase tracking-widest">
            Nexus Pro — Code Review Engine
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
          <GitPullRequest size={16} className="text-nexus-accent" />
          Code Review
        </h2>
        <button
          onClick={fetchPRs}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-nexus-bg hover:bg-nexus-bg/80 text-white rounded-lg text-[10px] font-bold transition-all border border-nexus-border uppercase tracking-widest"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {/* Loading */}
        {loading && prs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Loader2 size={24} className="animate-spin text-nexus-accent" />
            <p className="text-[10px] text-nexus-text-muted">Fetching pull requests...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-400" />
              <span className="text-[10px] font-bold text-red-400">Failed to load</span>
            </div>
            <p className="text-[10px] text-nexus-text-muted">{error}</p>
            <button
              onClick={fetchPRs}
              className="text-[10px] text-nexus-accent font-bold hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-nexus-bg rounded-xl border border-nexus-border text-center shadow-sm">
              <div className="text-sm font-bold text-emerald-400">{openCount}</div>
              <div className="text-[9px] text-nexus-text-muted uppercase font-bold tracking-wider">Open</div>
            </div>
            <div className="p-2.5 bg-nexus-bg rounded-xl border border-nexus-border text-center shadow-sm">
              <div className="text-sm font-bold text-violet-400">{mergedCount}</div>
              <div className="text-[9px] text-nexus-text-muted uppercase font-bold tracking-wider">Merged</div>
            </div>
            <div className="p-2.5 bg-nexus-bg rounded-xl border border-nexus-border text-center shadow-sm">
              <div className="text-sm font-bold text-gray-400">{closedCount}</div>
              <div className="text-[9px] text-nexus-text-muted uppercase font-bold tracking-wider">Closed</div>
            </div>
          </div>
        )}

        {/* PR List */}
        {!loading && !error && prs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <GitPullRequest size={24} className="text-nexus-text-muted opacity-30" />
            <p className="text-[10px] text-nexus-text-muted italic opacity-50">No pull requests found</p>
          </div>
        )}

        {!loading && !error && prs.length > 0 && (
          <div className="space-y-2">
            {prs.map(pr => {
              const status = getPRStatus(pr);
              const isExpanded = expandedId === pr.id;
              return (
                <div key={pr.id} className="bg-nexus-bg rounded-xl border border-nexus-border shadow-sm overflow-hidden">
                  {/* PR Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : pr.id)}
                    className="w-full p-3 text-left hover:bg-nexus-bg/80 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <GitPullRequest size={14} className="text-nexus-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-nexus-accent font-bold">#{pr.number}</span>
                          <span className={cn('px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase', statusColors[status])}>
                            {status}
                          </span>
                          {pr.draft && (
                            <span className="px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border-amber-500/30">
                              Draft
                            </span>
                          )}
                          {isExpanded ? <ChevronDown size={12} className="text-nexus-text-muted ml-auto" /> : <ChevronRight size={12} className="text-nexus-text-muted ml-auto" />}
                        </div>
                        <div className="text-[11px] font-bold text-white truncate">{pr.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {pr.user?.avatar_url && (
                            <img src={pr.user.avatar_url} alt={pr.user.login} className="w-4 h-4 rounded" />
                          )}
                          <span className="text-[10px] text-nexus-text-muted">{pr.user?.login}</span>
                          <span className="text-[9px] text-nexus-text-muted">•</span>
                          <span className="text-[10px] text-nexus-text-muted">{pr.head?.ref}</span>
                          <span className="text-[9px] text-nexus-text-muted">•</span>
                          <span className="flex items-center gap-1 text-[9px] text-nexus-text-muted">
                            <Clock size={9} />
                            {formatRelativeTime(pr.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-nexus-border p-3 space-y-3">
                      {/* Diff Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
                          <FileDiff size={12} className="text-nexus-accent" />
                          Changes
                        </div>
                        <div className="bg-nexus-sidebar rounded-lg p-2 space-y-1">
                          <div className="flex items-center gap-4 text-[10px]">
                            <span className="text-nexus-text-muted font-bold">{pr.changed_files} file{pr.changed_files !== 1 ? 's' : ''}</span>
                            <span className="text-emerald-400 font-bold">+{pr.additions}</span>
                            <span className="text-red-400 font-bold">-{pr.deletions}</span>
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      {pr.body && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest">
                            <MessageSquare size={12} className="text-nexus-accent" />
                            Description
                          </div>
                          <div className="bg-nexus-sidebar rounded-lg p-2.5 max-h-32 overflow-y-auto no-scrollbar">
                            <p className="text-[10px] text-nexus-text-muted leading-relaxed whitespace-pre-wrap">{pr.body}</p>
                          </div>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-2 text-[9px] text-nexus-text-muted">
                        <span>Created: {new Date(pr.created_at).toLocaleString()}</span>
                        {pr.merged_at && <span>• Merged: {new Date(pr.merged_at).toLocaleString()}</span>}
                        {pr.state === 'closed' && !pr.merged_at && <span>• Closed: {new Date(pr.updated_at).toLocaleString()}</span>}
                      </div>

                      {/* Open on GitHub */}
                      <a
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-nexus-accent/20 uppercase tracking-widest"
                      >
                        <ExternalLink size={12} />
                        Open on GitHub
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-nexus-border bg-nexus-bg">
        <p className="text-[9px] text-nexus-text-muted text-center font-bold uppercase tracking-widest">
          Nexus Pro — Code Review Engine
        </p>
      </div>
    </div>
  );
}
