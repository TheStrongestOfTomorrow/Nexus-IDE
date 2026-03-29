import React, { useState } from 'react';
import { GitBranch, Play, CheckCircle2, XCircle, Clock, Loader2, Package, Rocket, Hammer, History } from 'lucide-react';
import { cn } from '../lib/utils';

interface PipelineStage {
  name: string;
  status: 'success' | 'running' | 'failed' | 'pending';
  duration?: string;
}

interface Pipeline {
  id: string;
  commit: string;
  message: string;
  branch: string;
  author: string;
  status: 'success' | 'running' | 'failed' | 'pending';
  stages: PipelineStage[];
  timestamp: string;
  duration: string;
}

export default function CICDPipeline() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    {
      id: '1',
      commit: 'a3f7c2d',
      message: 'feat: add multi-environment config',
      branch: 'main',
      author: 'Alex Chen',
      status: 'running',
      stages: [
        { name: 'Build', status: 'success', duration: '1m 12s' },
        { name: 'Test', status: 'running' },
        { name: 'Deploy', status: 'pending' },
      ],
      timestamp: '2 min ago',
      duration: '2m 34s...',
    },
    {
      id: '2',
      commit: 'b8e4f1a',
      message: 'fix: resolve WebSocket memory leak',
      branch: 'main',
      author: 'Sarah Kim',
      status: 'success',
      stages: [
        { name: 'Build', status: 'success', duration: '58s' },
        { name: 'Test', status: 'success', duration: '2m 03s' },
        { name: 'Deploy', status: 'success', duration: '1m 45s' },
      ],
      timestamp: '1 hr ago',
      duration: '4m 46s',
    },
    {
      id: '3',
      commit: 'c2d9e3b',
      message: 'chore: update dependencies',
      branch: 'develop',
      author: 'James Park',
      status: 'failed',
      stages: [
        { name: 'Build', status: 'success', duration: '1m 05s' },
        { name: 'Test', status: 'failed', duration: '0m 48s' },
        { name: 'Deploy', status: 'pending' },
      ],
      timestamp: '3 hrs ago',
      duration: '1m 53s',
    },
    {
      id: '4',
      commit: 'd1a6c8e',
      message: 'refactor: auth module cleanup',
      branch: 'main',
      author: 'Mike Torres',
      status: 'success',
      stages: [
        { name: 'Build', status: 'success', duration: '1m 20s' },
        { name: 'Test', status: 'success', duration: '2m 15s' },
        { name: 'Deploy', status: 'success', duration: '1m 30s' },
      ],
      timestamp: '5 hrs ago',
      duration: '5m 05s',
    },
    {
      id: '5',
      commit: 'e7f2b4c',
      message: 'feat: implement dark mode toggle',
      branch: 'feat/dark-mode',
      author: 'Lisa Wang',
      status: 'success',
      stages: [
        { name: 'Build', status: 'success', duration: '55s' },
        { name: 'Test', status: 'success', duration: '1m 50s' },
        { name: 'Deploy', status: 'success', duration: '1m 40s' },
      ],
      timestamp: '8 hrs ago',
      duration: '4m 25s',
    },
  ]);

  const [isTriggering, setIsTriggering] = useState(false);

  const statusColors: Record<string, string> = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    running: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    success: <CheckCircle2 size={14} />,
    running: <Loader2 size={14} className="animate-spin" />,
    failed: <XCircle size={14} />,
    pending: <Clock size={14} />,
  };

  const stageColors: Record<string, string> = {
    success: 'bg-emerald-500',
    running: 'bg-amber-500',
    failed: 'bg-red-500',
    pending: 'bg-gray-600',
  };

  const stageIcons: Record<string, React.ReactNode> = {
    Build: <Hammer size={10} />,
    Test: <Package size={10} />,
    Deploy: <Rocket size={10} />,
  };

  const handleTriggerBuild = () => {
    setIsTriggering(true);
    setTimeout(() => {
      const newPipeline: Pipeline = {
        id: String(Date.now()),
        commit: Math.random().toString(16).slice(2, 9),
        message: 'Manual build triggered',
        branch: 'main',
        author: 'You',
        status: 'running',
        stages: [
          { name: 'Build', status: 'running' },
          { name: 'Test', status: 'pending' },
          { name: 'Deploy', status: 'pending' },
        ],
        timestamp: 'Just now',
        duration: '0s...',
      };
      setPipelines(prev => [newPipeline, ...prev]);
      setIsTriggering(false);
    }, 1000);
  };

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
            <span className="text-[10px] font-bold text-amber-400">{pipelines.filter(p => p.status === 'running').length} running</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400">{pipelines.filter(p => p.status === 'success').length} passed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[10px] font-bold text-red-400">{pipelines.filter(p => p.status === 'failed').length} failed</span>
          </div>
        </div>

        <button
          onClick={handleTriggerBuild}
          disabled={isTriggering}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-nexus-accent/20 uppercase tracking-widest disabled:opacity-50"
        >
          {isTriggering ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Trigger Build
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Pipeline List */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
            <History size={12} className="text-nexus-accent" />
            Build History
          </h3>

          <div className="space-y-2">
            {pipelines.map(pipeline => (
              <div key={pipeline.id} className={cn(
                'bg-nexus-bg rounded-xl border shadow-sm overflow-hidden transition-all',
                pipeline.status === 'running' ? 'border-amber-500/30' : 'border-nexus-border'
              )}>
                {/* Pipeline Header */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase', statusColors[pipeline.status])}>
                        {statusIcons[pipeline.status]}
                        {pipeline.status}
                      </span>
                      <code className="text-[10px] text-nexus-accent font-mono font-bold">{pipeline.commit}</code>
                    </div>
                    <span className="text-[9px] text-nexus-text-muted">{pipeline.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-white font-bold truncate">{pipeline.message}</div>
                  <div className="flex items-center gap-2 text-[10px] text-nexus-text-muted">
                    <GitBranch size={10} />
                    <span>{pipeline.branch}</span>
                    <span>•</span>
                    <span>{pipeline.author}</span>
                    <span>•</span>
                    <Clock size={10} />
                    <span>{pipeline.duration}</span>
                  </div>
                </div>

                {/* Stage Progress */}
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-1">
                    {pipeline.stages.map((stage, i) => (
                      <React.Fragment key={stage.name}>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all',
                            stageColors[stage.status],
                            stage.status === 'running' && 'animate-pulse'
                          )}>
                            {stageIcons[stage.name]}
                          </div>
                          <span className="text-[9px] font-bold text-nexus-text-muted uppercase">{stage.name}</span>
                          {stage.duration && (
                            <span className="text-[8px] text-nexus-text-muted">{stage.duration}</span>
                          )}
                        </div>
                        {i < pipeline.stages.length - 1 && (
                          <div className="flex-1 h-0.5 rounded-full -mt-4">
                            <div className={cn(
                              'h-full rounded-full transition-all',
                              stage.status === 'success' ? 'bg-emerald-500' : stage.status === 'running' ? 'bg-amber-500' : stage.status === 'failed' ? 'bg-red-500' : 'bg-gray-600'
                            )} />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
