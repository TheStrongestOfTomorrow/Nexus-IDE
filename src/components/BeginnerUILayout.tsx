import React from 'react';
import {
  FilePlus, FolderOpen, Search, GitBranch, Play, MessageSquare, Settings,
  Download, Trash2, Save, Brain, Palette, Puzzle, Users, Gamepad2,
  Terminal, Zap, Layout, Box, ChevronRight, Sparkles, Lightbulb, Code2,
  BookOpen, FileCode, Monitor
} from 'lucide-react';
import { cn } from '../lib/utils';

export type BeginnerActivity = 'files' | 'code' | 'ai' | 'run' | 'tools' | 'workspace';

interface BeginnerUILayoutProps {
  children: React.ReactNode;
  activeActivity: BeginnerActivity;
  onActivityChange: (activity: BeginnerActivity) => void;
  fileCount: number;
  activeFileName?: string;
  onNewFile?: () => void;
  onOpenFolder?: () => void;
  onSaveWorkspace?: () => void;
  onOpenSettings?: () => void;
}

export default function BeginnerUILayout({
  children,
  activeActivity,
  onActivityChange,
  fileCount,
  activeFileName,
  onNewFile,
  onOpenFolder,
  onSaveWorkspace,
  onOpenSettings,
}: BeginnerUILayoutProps) {
  const navItems: { id: BeginnerActivity; label: string; description: string; icon: React.ElementType; color: string }[] = [
    { id: 'files', label: 'Files', description: 'Manage your project files', icon: FileCode, color: 'text-blue-400' },
    { id: 'code', label: 'Code', description: 'Write and edit code', icon: Code2, color: 'text-emerald-400' },
    { id: 'ai', label: 'AI Assistant', description: 'Get AI help with your code', icon: Sparkles, color: 'text-purple-400' },
    { id: 'run', label: 'Run & Preview', description: 'Execute code and see results', icon: Play, color: 'text-orange-400' },
    { id: 'tools', label: 'Tools', description: 'Search, git, extensions & more', icon: Layout, color: 'text-cyan-400' },
    { id: 'workspace', label: 'Workspace', description: 'Save and load projects', icon: Save, color: 'text-pink-400' },
  ];

  return (
    <div className="beginner-layout flex flex-col h-full">
      {/* Beginner Welcome Bar */}
      <div className="beginner-welcome-bar bg-nexus-sidebar border-b border-nexus-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-nexus-accent" />
              <span className="text-sm font-bold text-white">Nexus IDE</span>
              <span className="text-[9px] bg-nexus-accent/20 text-nexus-accent px-1.5 py-0.5 rounded-full font-bold">5.1</span>
            </div>
            {activeFileName && (
              <div className="flex items-center gap-1.5 text-nexus-text-muted">
                <ChevronRight size={12} />
                <span className="text-xs truncate max-w-[200px]">{activeFileName}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onSaveWorkspace && (
              <button
                onClick={onSaveWorkspace}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-nexus-accent/10 hover:bg-nexus-accent/20 text-nexus-accent rounded-lg text-[10px] font-bold transition-colors"
              >
                <Save size={12} />
                Save
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 hover:bg-nexus-bg rounded-lg text-nexus-text-muted hover:text-white transition-colors"
              >
                <Settings size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Beginner Navigation Tabs */}
      <div className="beginner-nav-tabs flex items-center bg-nexus-sidebar border-b border-nexus-border px-2">
        {navItems.map(({ id, label, description, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => onActivityChange(id)}
            className={cn(
              "beginner-nav-tab flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px",
              activeActivity === id
                ? "text-white border-nexus-accent bg-nexus-bg/30"
                : "text-nexus-text-muted hover:text-white border-transparent hover:bg-nexus-bg/10"
            )}
          >
            <Icon size={15} className={activeActivity === id ? color : ""} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Active Panel Description */}
      <div className="beginner-panel-hint bg-nexus-bg/50 border-b border-nexus-border px-4 py-1.5">
        <div className="flex items-center gap-2">
          <Lightbulb size={11} className="text-yellow-500/60" />
          <span className="text-[10px] text-nexus-text-muted">
            {navItems.find(n => n.id === activeActivity)?.description}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/* Beginner File Panel - Simplified file manager */
export function BeginnerFilePanel({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  onOpenFolder,
}: {
  files: any[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onAddFile: (name: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onOpenFolder?: () => void;
}) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddFile(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="beginner-panel w-full flex flex-col h-full">
      {/* Action Buttons */}
      <div className="px-4 py-3 border-b border-nexus-border bg-nexus-sidebar">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-3 py-2 bg-nexus-accent hover:bg-nexus-accent/80 text-white rounded-lg text-xs font-bold transition-all"
          >
            <FilePlus size={14} />
            New File
          </button>
          {onOpenFolder && (
            <button
              onClick={onOpenFolder}
              className="flex items-center gap-2 px-3 py-2 bg-nexus-bg hover:bg-nexus-border text-white rounded-lg text-xs font-medium transition-colors"
            >
              <FolderOpen size={14} />
              Open Folder
            </button>
          )}
          <span className="ml-auto text-[10px] text-nexus-text-muted">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => setIsAdding(false)}
              className="flex-1 bg-nexus-bg border border-nexus-accent rounded-lg px-3 py-2 text-sm outline-none text-white"
              placeholder="Enter filename (e.g., index.html)"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-nexus-accent text-white rounded-lg text-xs font-bold"
            >
              Create
            </button>
          </form>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <FileCode size={40} className="text-nexus-text-muted/20 mb-3" />
            <p className="text-sm text-nexus-text-muted mb-1">No files yet</p>
            <p className="text-[10px] text-nexus-text-muted/60 mb-4">
              Create a new file or open a folder to get started
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-nexus-accent/10 hover:bg-nexus-accent/20 text-nexus-accent rounded-lg text-xs font-bold transition-colors"
            >
              <FilePlus size={14} />
              Create Your First File
            </button>
          </div>
        ) : (
          <div className="py-2 px-2">
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={cn(
                  "group flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer mb-0.5 transition-all",
                  activeFileId === file.id
                    ? "bg-nexus-accent/15 border border-nexus-accent/30 text-white"
                    : "hover:bg-nexus-bg text-nexus-text-muted hover:text-white border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FileCode size={14} className="flex-shrink-0" />
                  <span className="text-xs truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                    className="p-1 hover:bg-red-500/20 rounded text-nexus-text-muted hover:text-red-400"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* Beginner Tools Panel - All tools in one place */
export function BeginnerToolsPanel({
  activeTool,
  onToolChange,
  children,
}: {
  activeTool: string;
  onToolChange: (tool: string) => void;
  children: React.ReactNode;
}) {
  const tools: { id: string; label: string; icon: React.ElementType }[] = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'git', label: 'Git / GitHub', icon: GitBranch },
    { id: 'extensions', label: 'Extensions', icon: Puzzle },
    { id: 'collab', label: 'Collaboration', icon: Users },
    { id: 'themes', label: 'Themes', icon: Palette },
    { id: 'minecraft', label: 'Minecraft', icon: Gamepad2 },
    { id: 'webcontainer', label: 'WebContainer', icon: Box },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
  ];

  return (
    <div className="beginner-panel flex flex-col h-full">
      <div className="flex items-center gap-1 px-4 py-3 border-b border-nexus-border bg-nexus-sidebar overflow-x-auto no-scrollbar">
        {tools.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onToolChange(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all flex-shrink-0",
              activeTool === id
                ? "bg-nexus-accent text-white"
                : "bg-nexus-bg text-nexus-text-muted hover:text-white"
            )}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
