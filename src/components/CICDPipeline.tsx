import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, Play, CheckCircle2, XCircle, Clock, Loader2, ExternalLink, RefreshCw, Settings, AlertCircle, Rocket } from 'lucide-react';
import { cn } from '../lib/utils';

interface CICDPipelineProps {
  githubToken?: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | 'action_required' | 'neutral' | null;
  created_at: string;
  updated_at: string;
  head_branch: string;
  event: string;
  actor: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  display_title: string;
}

const RUNS_API = 'https://api.github.com/repos/TheStrongestOfTomorrow/Nexus-IDE/actions/runs?per_page=15';
const DISPATCH_API = 'https://api.github.com/repos/TheStrongestOfTomorrow/Nexus-IDE/actions/workflows/release.yml/dispatches';

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m ${secs % 60}s`;
  return `${secs}s`;
}

function formatRelativeTime(dateStr: string): string {
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
}

export default function CICDPipeline({ githubToken }: CICDPipelineProps) {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    if (!githubToken) {
      setRuns([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(RUNS_API, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setRuns(data.workflow_runs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflow runs');
    } finally {
      setLoading(false);
    }
  }, [githubToken]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const handleTrigger = async () => {
    if (!githubToken || triggering) return;
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch(DISPATCH_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({ ref: 'main' }),
      });
      if (!res.ok) {
        throw new Error(`Trigger failed: ${res.status}`);
      }
      setTriggerResult('success');
      // Refresh after a short delay to pick up the new run
      setTimeout(() => fetchRuns(), 3000);
    } catch (err: any) {
      setTriggerResult(err.message || 'Trigger failed');
    } finally {
      setTriggering(false);
    }
  };

  const getRunStatus = (run: WorkflowRun): string => {
    if (run.status === 'in_progress') return 'running';
    if (run.status === 'queued') return 'queued';
    if (run.conclusion === 'success') return 'success';
    if (run.conclusion === 'failure') return 'failed';
    if (run.conclusion === 'cancelled') return 'cancelled';
    return 'completed';
  };

  const statusColors: Record<string, string> = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    running: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    queued: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    success: <CheckCircle2 size={14} />,
    running: <Loader2 size={14} className="animate-spin" />,
    failed: <XCircle size={14} />,
    queued: <Clock size={14} />,
    cancelled: <Clock size={14} />,
    completed: <CheckCircle2 size={14} />,
  };

  const eventColors: Record<string, string> = {
    push: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pull_request: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    workflow_dispatch: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    schedule: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };

  const successCount = runs.filter(r => r.conclusion === 'success').length;
  const failedCount = runs.filter(r => r.conclusion === 'failure').length;
  const runningCount = runs.filter(r => r.status === 'in_progress').length;

  // No token view
  if (!githubToken) {
    return (
      <div className="flex flex-col h-full bg-nexus-sidebar">
        <div className="p-4 border-b border-nexus-border">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
            <GitBranch size={16} className="text-nexus-accent" />
            CI/CD Pipeline
          </h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-16 h-16 bg-nexus-bg rounded-2xl flex items-center justify-center border border-nexus-border shadow-xl">
            <Settings size={32} className="text-nexus-text-muted" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-white">Connect Your GitHub Account</p>
            <p className="text-[10px] text-nexus-text-muted leading-relaxed max-w-[200px]">
              Connect your GitHub account in Settings to view CI/CD pipelines and trigger workflows.
            </p>
          </div>
        </div>
        <div className="p-3 border-t border-nexus-border bg-nexus-bg">
          <p className="text-[9px] text-nexus-text-muted text-center font-bold uppercase tracking-widest">
            Nexus Pro — CI/CD Automation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
          <GitBranch size={16} className="text-nexus-accent" />
          CI/CD Pipeline
        </h2>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold text-amber-400">{runningCount} running</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400">{successCount} passed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[10px] font-bold text-red-400">{failedCount} failed</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchRuns}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-bg hover:bg-nexus-bg/80 text-white rounded-lg text-[10px] font-bold transition-all border border-nexus-border uppercase tracking-widest"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-nexus-accent/20 uppercase tracking-widest disabled:opacity-50"
          >
            {triggering ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Trigger
          </button>
        </div>

        {triggerResult && triggerResult !== 'success' && (
          <p className="text-[9px] text-red-400 mt-2">{triggerResult}</p>
        )}
        {triggerResult === 'success' && (
          <p className="text-[9px] text-emerald-400 mt-2">Workflow dispatched successfully! Refreshing...</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {/* Loading */}
        {loading && runs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Loader2 size={24} className="animate-spin text-nexus-accent" />
            <p className="text-[10px] text-nexus-text-muted">Fetching workflow runs...</p>
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
            <button onClick={fetchRuns} className="text-[10px] text-nexus-accent font-bold hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* Runs List */}
        {!loading && !error && runs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <GitBranch size={24} className="text-nexus-text-muted opacity-30" />
            <p className="text-[10px] text-nexus-text-muted italic opacity-50">No workflow runs found</p>
          </div>
        )}

        {!loading && !error && runs.length > 0 && (
          <div className="space-y-2">
            {runs.map(run => {
              const runStatus = getRunStatus(run);
              return (
                <div
                  key={run.id}
                  className={cn(
                    'bg-nexus-bg rounded-xl border shadow-sm overflow-hidden transition-all',
                    run.status === 'in_progress' ? 'border-amber-500/30' : 'border-nexus-border'
                  )}
                >
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase', statusColors[runStatus])}>
                          {statusIcons[runStatus]}
                          {runStatus}
                        </span>
                        <span className={cn('px-1.5 py-0.5 rounded-md border text-[8px] font-bold uppercase', eventColors[run.event] || 'bg-nexus-bg text-nexus-text-muted border-nexus-border')}>
                          {run.event.replace('_', ' ')}
                        </span>
                      </div>
                      <a
                        href={run.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-nexus-text-muted hover:text-white transition-colors"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="text-[11px] text-white font-bold truncate">{run.display_title || run.name}</div>
                    <div className="text-[10px] text-nexus-text-muted font-bold">{run.name}</div>
                    <div className="flex items-center gap-2 text-[10px] text-nexus-text-muted">
                      <GitBranch size={10} />
                      <span>{run.head_branch}</span>
                      <span>•</span>
                      {run.actor?.avatar_url && (
                        <img src={run.actor.avatar_url} alt={run.actor.login} className="w-3.5 h-3.5 rounded" />
                      )}
                      <span>{run.actor?.login}</span>
                      <span>•</span>
                      <Clock size={10} />
                      <span>
                        {run.status === 'completed' ? formatDuration(run.created_at, run.updated_at) : '...'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-nexus-text-muted">
                      <span>{formatRelativeTime(run.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-nexus-border bg-nexus-bg">
        <p className="text-[9px] text-nexus-text-muted text-center font-bold uppercase tracking-widest">
          Nexus Pro — CI/CD Automation
        </p>
      </div>
    </div>
  );
}
