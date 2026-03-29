import React, { useState } from 'react';
import { LayoutDashboard, FileCode, Activity, Brain, Clock, Zap, GitCommit, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface TimelineEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

interface SprintTask {
  id: string;
  title: string;
  assignee: string;
  done: boolean;
}

export default function ProjectDashboard() {
  const [stats] = useState<StatCard[]>([
    { label: 'Total Files', value: 247, icon: <FileCode size={16} />, color: 'text-nexus-accent', bgColor: 'bg-nexus-accent/10', borderColor: 'border-nexus-accent/30' },
    { label: 'Lines of Code', value: '48.2K', icon: <BarChart3 size={16} />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
    { label: 'AI Queries Today', value: 134, icon: <Brain size={16} />, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30' },
    { label: 'Active Sessions', value: 12, icon: <Activity size={16} />, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
    { label: 'Uptime', value: '99.9%', icon: <Clock size={16} />, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  ]);

  const [timeline] = useState<TimelineEntry[]>([
    { id: '1', action: 'Deployed to production', user: 'Alex Chen', timestamp: '2 min ago', icon: <Zap size={12} />, color: 'bg-emerald-500' },
    { id: '2', action: 'Pushed 5 commits to main', user: 'Sarah Kim', timestamp: '15 min ago', icon: <GitCommit size={12} />, color: 'bg-violet-500' },
    { id: '3', action: 'AI refactored utils.ts', user: 'AI Assistant', timestamp: '30 min ago', icon: <Brain size={12} />, color: 'bg-cyan-500' },
    { id: '4', action: 'Created PR #142', user: 'Mike Torres', timestamp: '1 hr ago', icon: <GitCommit size={12} />, color: 'bg-blue-500' },
    { id: '5', action: 'Merged PR #139', user: 'Alex Chen', timestamp: '2 hrs ago', icon: <CheckCircle2 size={12} />, color: 'bg-emerald-500' },
    { id: '6', action: 'Updated env config', user: 'Lisa Wang', timestamp: '3 hrs ago', icon: <FileCode size={12} />, color: 'bg-amber-500' },
    { id: '7', action: 'Ran CI pipeline', user: 'Auto', timestamp: '3 hrs ago', icon: <Zap size={12} />, color: 'bg-violet-500' },
    { id: '8', action: 'Added team member', user: 'Alex Chen', timestamp: '5 hrs ago', icon: <Activity size={12} />, color: 'bg-rose-500' },
    { id: '9', action: 'Edited dashboard', user: 'James Park', timestamp: '6 hrs ago', icon: <FileCode size={12} />, color: 'bg-blue-500' },
    { id: '10', action: 'AI generated tests', user: 'AI Assistant', timestamp: '8 hrs ago', icon: <Brain size={12} />, color: 'bg-cyan-500' },
  ]);

  const [productivity] = useState([
    { day: 'Mon', value: 72 },
    { day: 'Tue', value: 85 },
    { day: 'Wed', value: 64 },
    { day: 'Thu', value: 91 },
    { day: 'Fri', value: 78 },
    { day: 'Sat', value: 45 },
    { day: 'Sun', value: 30 },
  ]);

  const [sprintTasks] = useState<SprintTask[]>([
    { id: '1', title: 'Implement auth flow', assignee: 'Alex Chen', done: true },
    { id: '2', title: 'Fix memory leak in WS', assignee: 'Sarah Kim', done: true },
    { id: '3', title: 'Add dark mode toggle', assignee: 'Mike Torres', done: true },
    { id: '4', title: 'Update API endpoints', assignee: 'James Park', done: true },
    { id: '5', title: 'Write unit tests', assignee: 'Lisa Wang', done: false },
    { id: '6', title: 'Optimize bundle size', assignee: 'Sarah Kim', done: false },
    { id: '7', title: 'Deploy to staging', assignee: 'Alex Chen', done: false },
  ]);

  const completedTasks = sprintTasks.filter(t => t.done).length;
  const totalTasks = sprintTasks.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-1 flex items-center gap-2">
          <LayoutDashboard size={16} className="text-nexus-accent" />
          Project Dashboard
        </h2>
        <p className="text-[10px] text-nexus-text-muted">Real-time project metrics and team productivity</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Stats Cards */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={12} className="text-nexus-accent" />
            Overview
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat, i) => (
              <div key={i} className={cn('p-3 rounded-xl border shadow-sm', stat.bgColor, stat.borderColor)}>
                <div className={cn('mb-2', stat.color)}>{stat.icon}</div>
                <div className="text-lg font-bold text-white leading-none">{stat.value}</div>
                <div className="text-[10px] text-nexus-text-muted uppercase tracking-wider font-bold mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Productivity Chart */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={12} className="text-nexus-accent" />
            Team Productivity
          </h3>
          <div className="bg-nexus-bg rounded-xl border border-nexus-border p-4 shadow-sm">
            <div className="flex items-end gap-2 h-32">
              {productivity.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-nexus-text-muted font-bold">{item.value}%</span>
                  <div className="w-full bg-nexus-sidebar rounded-t-sm overflow-hidden" style={{ height: '96px' }}>
                    <div
                      className={cn(
                        'w-full rounded-t-sm transition-all',
                        item.value >= 80 ? 'bg-emerald-500' : item.value >= 60 ? 'bg-amber-500' : 'bg-red-500/60'
                      )}
                      style={{ height: `${item.value}%`, marginTop: `${100 - item.value}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-nexus-text-muted font-bold">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sprint Progress */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={12} className="text-nexus-accent" />
            Sprint Progress
          </h3>
          <div className="bg-nexus-bg rounded-xl border border-nexus-border p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Sprint 14</span>
              <span className="text-[10px] font-bold text-nexus-accent">{completedTasks}/{totalTasks} tasks</span>
            </div>
            <div className="w-full bg-nexus-sidebar rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-nexus-accent to-emerald-400 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-nexus-text-muted font-bold">{progressPercent}% complete</div>
            <div className="space-y-1.5 mt-2">
              {sprintTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-nexus-sidebar hover:bg-nexus-sidebar/80 transition-colors">
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                    task.done ? 'bg-emerald-500 border-emerald-500' : 'border-nexus-border'
                  )}>
                    {task.done && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className={cn('text-[10px] flex-1 truncate', task.done ? 'text-nexus-text-muted line-through' : 'text-white font-bold')}>
                    {task.title}
                  </span>
                  <span className="text-[9px] text-nexus-text-muted shrink-0">{task.assignee.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} className="text-nexus-accent" />
            Recent Activity
          </h3>
          <div className="bg-nexus-bg rounded-xl border border-nexus-border overflow-hidden shadow-sm">
            {timeline.map((entry, i) => (
              <div key={entry.id} className={cn('flex items-center gap-2.5 p-2.5 border-b border-nexus-border last:border-none hover:bg-nexus-sidebar transition-colors', i === 0 && 'bg-nexus-sidebar')}>
                <div className={cn('w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0', entry.color)}>
                  {entry.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-white truncate">{entry.action}</div>
                  <div className="text-[9px] text-nexus-text-muted">{entry.user}</div>
                </div>
                <span className="text-[9px] text-nexus-text-muted shrink-0">{entry.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-nexus-border bg-nexus-bg">
        <p className="text-[9px] text-nexus-text-muted text-center font-bold uppercase tracking-widest">
          Nexus Pro — Project Analytics
        </p>
      </div>
    </div>
  );
}
