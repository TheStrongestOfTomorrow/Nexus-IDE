import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, FileCode, Activity, BarChart3, TrendingUp, CheckCircle2, Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { FileNode } from '../hooks/useFileSystem';

interface ProjectDashboardProps {
  files?: FileNode[];
}

interface SprintTask {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

const SPRINT_STORAGE_KEY = 'nexus_sprint_tasks';

function loadSprintTasks(): SprintTask[] {
  try {
    const data = localStorage.getItem(SPRINT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSprintTasks(tasks: SprintTask[]) {
  localStorage.setItem(SPRINT_STORAGE_KEY, JSON.stringify(tasks));
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export default function ProjectDashboard({ files = [] }: ProjectDashboardProps) {
  const [sprintTasks, setSprintTasks] = useState<SprintTask[]>(loadSprintTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Persist sprint tasks
  useEffect(() => {
    saveSprintTasks(sprintTasks);
  }, [sprintTasks]);

  // Compute real metrics from files
  const stats = useMemo(() => {
    let totalLines = 0;
    let totalChars = 0;
    const extensions: Record<string, number> = {};
    let largestFile = { name: '-', lines: 0 };

    files.forEach(file => {
      const lines = file.content.split('\n').length;
      totalLines += lines;
      totalChars += file.content.length;

      const ext = file.name.includes('.') ? file.name.split('.').pop()! : 'other';
      extensions[ext] = (extensions[ext] || 0) + 1;

      if (lines > largestFile.lines) {
        largestFile = { name: file.name, lines };
      }
    });

    const languageCount = Object.keys(extensions).length;

    return { totalLines, totalChars, languageCount, largestFile, extensionCount: Object.keys(extensions).length };
  }, [files]);

  // Top 8 files by line count for chart
  const topFiles = useMemo(() => {
    return files
      .map(f => ({ name: f.name, lines: f.content.split('\n').length }))
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 8);
  }, [files]);

  // Language breakdown
  const languages = useMemo(() => {
    const langs: Record<string, number> = {};
    files.forEach(f => {
      const lang = f.language || 'text';
      langs[lang] = (langs[lang] || 0) + 1;
    });
    return Object.entries(langs).sort(([, a], [, b]) => b - a);
  }, [files]);

  const maxLines = topFiles.length > 0 ? Math.max(...topFiles.map(f => f.lines)) : 1;

  const completedTasks = sprintTasks.filter(t => t.done).length;
  const totalTasks = sprintTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: SprintTask = {
      id: String(Date.now()),
      title: newTaskTitle.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    setSprintTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setSprintTasks(prev => prev.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    ));
  };

  const removeTask = (id: string) => {
    setSprintTasks(prev => prev.filter(t => t.id !== id));
  };

  const statCards = [
    { label: 'Total Files', value: files.length, icon: <FileCode size={16} />, color: 'text-nexus-accent', bgColor: 'bg-nexus-accent/10', borderColor: 'border-nexus-accent/30' },
    { label: 'Lines of Code', value: formatNumber(stats.totalLines), icon: <BarChart3 size={16} />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
    { label: 'Characters', value: formatNumber(stats.totalChars), icon: <FileCode size={16} />, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30' },
    { label: 'Languages', value: stats.extensionCount, icon: <Activity size={16} />, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
    { label: 'Largest File', value: stats.largestFile.lines, sub: stats.largestFile.name, icon: <TrendingUp size={16} />, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  ];

  return (
    <div className="flex flex-col h-full bg-nexus-sidebar">
      <div className="p-4 border-b border-nexus-border">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-1 flex items-center gap-2">
          <LayoutDashboard size={16} className="text-nexus-accent" />
          Project Dashboard
        </h2>
        <p className="text-[10px] text-nexus-text-muted">Real-time metrics computed from your project files</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Stats Cards */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={12} className="text-nexus-accent" />
            Overview
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {statCards.map((stat, i) => (
              <div key={i} className={cn('p-3 rounded-xl border shadow-sm', stat.bgColor, stat.borderColor)}>
                <div className={cn('mb-2', stat.color)}>{stat.icon}</div>
                <div className="text-lg font-bold text-white leading-none">{stat.value}</div>
                {stat.sub && (
                  <div className="text-[9px] text-nexus-text-muted truncate mt-0.5 font-mono">{stat.sub}</div>
                )}
                <div className="text-[10px] text-nexus-text-muted uppercase tracking-wider font-bold mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* File Size Chart */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={12} className="text-nexus-accent" />
            Lines Per File (Top 8)
          </h3>
          <div className="bg-nexus-bg rounded-xl border border-nexus-border p-4 shadow-sm">
            {topFiles.length === 0 ? (
              <p className="text-[10px] text-nexus-text-muted italic text-center py-4 opacity-50">No files loaded</p>
            ) : (
              <div className="space-y-2">
                {topFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] text-nexus-text-muted font-mono w-24 truncate shrink-0" title={file.name}>
                      {file.name}
                    </span>
                    <div className="flex-1 bg-nexus-sidebar rounded-full h-3 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          file.lines >= maxLines * 0.8 ? 'bg-emerald-500' :
                          file.lines >= maxLines * 0.5 ? 'bg-amber-500' : 'bg-nexus-accent'
                        )}
                        style={{ width: `${(file.lines / maxLines) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-nexus-text-muted font-bold w-10 text-right shrink-0">{file.lines}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
            <FileCode size={12} className="text-nexus-accent" />
            Languages
          </h3>
          <div className="bg-nexus-bg rounded-xl border border-nexus-border p-3 shadow-sm space-y-2">
            {languages.map(([lang, count]) => (
              <div key={lang} className="flex items-center gap-2">
                <div className="flex-1 bg-nexus-sidebar rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-nexus-accent rounded-full transition-all"
                    style={{ width: `${(count / files.length) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-white font-bold w-20 text-right truncate">{lang}</span>
                <span className="text-[9px] text-nexus-text-muted w-8 text-right">{count}</span>
              </div>
            ))}
            {languages.length === 0 && (
              <p className="text-[10px] text-nexus-text-muted italic text-center opacity-50">No files loaded</p>
            )}
          </div>
        </div>

        {/* Sprint Progress */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={12} className="text-nexus-accent" />
            Sprint Tasks
          </h3>
          <div className="bg-nexus-bg rounded-xl border border-nexus-border p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Current Sprint</span>
              <span className="text-[10px] font-bold text-nexus-accent">{completedTasks}/{totalTasks} tasks</span>
            </div>
            {totalTasks > 0 && (
              <>
                <div className="w-full bg-nexus-sidebar rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-nexus-accent to-emerald-400 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-[10px] text-nexus-text-muted font-bold">{progressPercent}% complete</div>
              </>
            )}
            <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto no-scrollbar">
              {sprintTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-nexus-sidebar hover:bg-nexus-sidebar/80 transition-colors group">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      task.done ? 'bg-emerald-500 border-emerald-500' : 'border-nexus-border'
                    )}
                  >
                    {task.done && <CheckCircle2 size={10} className="text-white" />}
                  </button>
                  <span className={cn('text-[10px] flex-1 truncate', task.done ? 'text-nexus-text-muted line-through' : 'text-white font-bold')}>
                    {task.title}
                  </span>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-1 text-nexus-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            {sprintTasks.length === 0 && (
              <p className="text-[10px] text-nexus-text-muted italic text-center py-2 opacity-50">No tasks yet. Add one below.</p>
            )}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="New task..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                className="flex-1 bg-nexus-sidebar border border-nexus-border rounded-lg px-3 py-1.5 text-[10px] outline-none text-white focus:border-nexus-accent"
              />
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest disabled:opacity-50"
              >
                <Plus size={12} />
              </button>
            </div>
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
